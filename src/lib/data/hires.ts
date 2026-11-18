import "server-only";
import { connectDB } from "../mongodb";
import { Hire } from "@/models/Hire";

export type HireRow = {
  id: string;
  kind: "hire" | "demo";
  refunded: boolean;
  tutorId: string;
  tutorName: string;
  vacancyTitle: string;
  studentLocation: string;
  monthlySalary: number;
  commission: number;
  hiredAt: string;
  posterUrl: string;
  note: string;
  createdBy: string;
};

type LeanHire = {
  _id: unknown;
  kind?: string;
  refunded?: boolean;
  tutorId: unknown;
  tutorName: string;
  vacancyTitle: string;
  studentLocation?: string;
  monthlySalary: number;
  commission: number;
  hiredAt: Date;
  posterUrl?: string;
  note?: string;
  createdBy?: string;
};

function toRow(h: LeanHire): HireRow {
  return {
    id: String(h._id),
    kind: h.kind === "demo" ? "demo" : "hire",
    refunded: !!h.refunded,
    tutorId: String(h.tutorId),
    tutorName: h.tutorName,
    vacancyTitle: h.vacancyTitle,
    studentLocation: h.studentLocation ?? "",
    monthlySalary: h.monthlySalary ?? 0,
    commission: h.commission ?? 0,
    hiredAt: new Date(h.hiredAt).toISOString(),
    posterUrl: h.posterUrl ?? "",
    note: h.note ?? "",
    createdBy: h.createdBy ?? "",
  };
}

const FIELDS = "kind refunded tutorId tutorName vacancyTitle studentLocation monthlySalary commission hiredAt posterUrl note createdBy";

export async function getTutorHires(tutorId: string): Promise<HireRow[]> {
  await connectDB();
  const rows = await Hire.find({ tutorId }).select(FIELDS).sort({ hiredAt: -1, createdAt: -1 }).lean<LeanHire[]>();
  return rows.map(toRow);
}

// ---- Revenue -------------------------------------------------------------

// Periods follow Nepal local time (UTC+05:45); the week starts on Sunday.
const OFFSET_MS = (5 * 60 + 45) * 60 * 1000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function nepalParts(d: Date) {
  const n = new Date(d.getTime() + OFFSET_MS);
  return { y: n.getUTCFullYear(), m: n.getUTCMonth(), d: n.getUTCDate(), dow: n.getUTCDay() };
}
/** The instant of Nepal-local midnight on y-m-d (day may overflow; Date.UTC normalises). */
function nepalMidnight(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d) - OFFSET_MS);
}

export const REVENUE_PERIODS = {
  week: "This week",
  month: "This month",
  year: "This year",
  all: "All time",
} as const;
export type RevenuePeriod = keyof typeof REVENUE_PERIODS;

export function periodStart(period: RevenuePeriod, now = new Date()): Date | null {
  const p = nepalParts(now);
  switch (period) {
    case "week":
      return nepalMidnight(p.y, p.m, p.d - p.dow);
    case "month":
      return nepalMidnight(p.y, p.m, 1);
    case "year":
      return nepalMidnight(p.y, 0, 1);
    default:
      return null;
  }
}

/**
 * hires/salary/commission cover placements only. demos counts demo classes;
 * deposits is demo deposits still held (not refunded). collected = commission + deposits.
 */
export type Totals = {
  hires: number;
  tutors: number;
  salary: number;
  commission: number;
  demos: number;
  deposits: number;
  collected: number;
};
export type BreakdownRow = Totals & { key: string; label: string };

function emptyTotals(): Totals & { tutorSet: Set<string> } {
  return { hires: 0, tutors: 0, salary: 0, commission: 0, demos: 0, deposits: 0, collected: 0, tutorSet: new Set() };
}
function add(t: ReturnType<typeof emptyTotals>, h: HireRow) {
  if (h.kind === "demo") {
    t.demos += 1;
    if (!h.refunded) {
      t.deposits += h.commission;
      t.collected += h.commission;
    }
    return;
  }
  t.hires += 1;
  t.salary += h.monthlySalary;
  t.commission += h.commission;
  t.collected += h.commission;
  t.tutorSet.add(h.tutorId);
}
function finish({ tutorSet, ...t }: ReturnType<typeof emptyTotals>): Totals {
  return { ...t, tutors: tutorSet.size };
}

export async function getRevenueReport(period: RevenuePeriod) {
  await connectDB();
  // Placements number in the hundreds or low thousands, so aggregate in memory.
  const all = (await Hire.find().select(FIELDS).sort({ hiredAt: -1, createdAt: -1 }).limit(20000).lean<LeanHire[]>()).map(toRow);

  const now = new Date();
  const starts = {
    week: periodStart("week", now)!,
    month: periodStart("month", now)!,
    year: periodStart("year", now)!,
  };
  const summary = { week: emptyTotals(), month: emptyTotals(), year: emptyTotals(), all: emptyTotals() };

  // Last 8 weeks, last 12 months, every year with data.
  const nowParts = nepalParts(now);
  const weeks: { start: Date; row: ReturnType<typeof emptyTotals>; label: string; key: string }[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = nepalMidnight(nowParts.y, nowParts.m, nowParts.d - nowParts.dow - i * 7);
    const s = nepalParts(start);
    const e = nepalParts(new Date(start.getTime() + 6 * 86400000));
    const label =
      i === 0 ? "This week" : `${s.d} ${MONTHS[s.m]} – ${e.d} ${MONTHS[e.m]}${e.y !== nowParts.y ? ` ${e.y}` : ""}`;
    weeks.push({ start, row: emptyTotals(), label, key: start.toISOString() });
  }
  const months = new Map<string, ReturnType<typeof emptyTotals>>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(nowParts.y, nowParts.m - i, 1));
    months.set(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`, emptyTotals());
  }
  const years = new Map<string, ReturnType<typeof emptyTotals>>();

  for (const h of all) {
    const at = new Date(h.hiredAt);
    add(summary.all, h);
    if (at >= starts.year) add(summary.year, h);
    if (at >= starts.month) add(summary.month, h);
    if (at >= starts.week) add(summary.week, h);

    // Newest week first; anything older than 8 weeks falls through.
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (at >= weeks[i]!.start) {
        add(weeks[i]!.row, h);
        break;
      }
    }
    const p = nepalParts(at);
    const mKey = `${p.y}-${String(p.m + 1).padStart(2, "0")}`;
    const m = months.get(mKey);
    if (m) add(m, h);
    const yKey = String(p.y);
    if (!years.has(yKey)) years.set(yKey, emptyTotals());
    add(years.get(yKey)!, h);
  }

  const start = period === "all" ? null : starts[period];
  const hires = start ? all.filter((h) => new Date(h.hiredAt) >= start) : all;

  return {
    summary: {
      week: finish(summary.week),
      month: finish(summary.month),
      year: finish(summary.year),
      all: finish(summary.all),
    },
    weekly: weeks.map((w): BreakdownRow => ({ key: w.key, label: w.label, ...finish(w.row) })).reverse(),
    monthly: [...months.entries()]
      .map(([key, t]): BreakdownRow => {
        const [y, m] = key.split("-").map(Number);
        return { key, label: `${MONTHS[m! - 1]} ${y}`, ...finish(t) };
      })
      .reverse(),
    yearly: [...years.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, t]): BreakdownRow => ({ key, label: key, ...finish(t) })),
    hires: hires.slice(0, 200),
    hireCount: hires.length,
  };
}
