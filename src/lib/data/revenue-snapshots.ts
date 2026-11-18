import "server-only";
import { connectDB } from "../mongodb";
import { RevenueSnapshot } from "@/models/RevenueSnapshot";
import { currentNepalYear, type Totals, type YearSummary } from "./hires";

export type SnapshotRow = {
  id: string;
  year: string;
  kind: "final" | "manual";
  totals: Totals;
  months: Totals[];
  savedAt: string;
  savedBy: string;
  note: string;
};

const ZERO: Totals = { hires: 0, tutors: 0, salary: 0, commission: 0, demos: 0, deposits: 0, collected: 0 };

type Lean = {
  _id: unknown;
  year: string;
  kind: string;
  totals?: Partial<Totals>;
  months?: Partial<Totals>[];
  savedAt: Date;
  savedBy?: string;
  note?: string;
};

function toRow(s: Lean): SnapshotRow {
  return {
    id: String(s._id),
    year: s.year,
    kind: s.kind === "final" ? "final" : "manual",
    totals: { ...ZERO, ...s.totals },
    months: (s.months ?? []).map((m) => ({ ...ZERO, ...m })),
    savedAt: new Date(s.savedAt).toISOString(),
    savedBy: s.savedBy ?? "",
    note: s.note ?? "",
  };
}

export async function listSnapshots(): Promise<SnapshotRow[]> {
  await connectDB();
  const rows = await RevenueSnapshot.find().sort({ year: -1, savedAt: -1 }).limit(500).lean<Lean[]>();
  return rows.map(toRow);
}

/** Save a manual snapshot of one year's current figures. */
export async function saveManualSnapshot(summary: YearSummary, by: string, note: string) {
  await connectDB();
  const doc = await RevenueSnapshot.create({
    year: summary.year,
    kind: "manual",
    totals: summary.totals,
    months: summary.months,
    savedAt: new Date(),
    savedBy: by,
    note,
  });
  return String(doc._id);
}

/**
 * Save the year-end figures of every finished year that has none yet.
 * Idempotent: the unique index allows one "final" snapshot per year.
 */
export async function saveFinishedYears(years: YearSummary[]) {
  const thisYear = currentNepalYear();
  const finished = years.filter((y) => y.year < thisYear);
  if (!finished.length) return 0;
  await connectDB();
  const existing = new Set(
    (await RevenueSnapshot.find({ kind: "final", year: { $in: finished.map((y) => y.year) } }).select("year").lean<{ year: string }[]>()).map(
      (s) => s.year
    )
  );
  let saved = 0;
  for (const y of finished) {
    if (existing.has(y.year)) continue;
    try {
      await RevenueSnapshot.create({
        year: y.year,
        kind: "final",
        totals: y.totals,
        months: y.months,
        savedAt: new Date(),
        savedBy: "Automatic (year end)",
        note: `Year-end figures for ${y.year}`,
      });
      saved += 1;
    } catch (err) {
      // Another request saved it first (duplicate key) — that's fine.
      if ((err as { code?: number }).code !== 11000) console.error("Failed to save year-end revenue", err);
    }
  }
  return saved;
}
