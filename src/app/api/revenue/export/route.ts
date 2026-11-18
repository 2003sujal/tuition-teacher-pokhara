import { guardAdmin } from "@/lib/api";
import { getYearSummaries, MONTH_LABELS, type Totals } from "@/lib/data/hires";
import { listSnapshots } from "@/lib/data/revenue-snapshots";

export const runtime = "nodejs";

const COLS: (keyof Totals)[] = ["hires", "tutors", "salary", "commission", "demos", "deposits", "collected"];
const HEAD = "Teachers hired,Distinct teachers,Teacher salary (Rs),Commission (Rs),Demo classes,Demo deposits held (Rs),Total collected (Rs)";

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Admin-only CSV: live yearly and monthly revenue, plus every saved snapshot. */
export async function GET(req: Request) {
  const { response } = await guardAdmin(req);
  if (response) return response;

  const [years, snapshots] = await Promise.all([getYearSummaries(), listSnapshots()]);
  const nums = (t: Totals) => COLS.map((k) => String(t[k])).join(",");

  const lines: string[] = [];
  lines.push("LIVE FIGURES (from current hire and demo records)");
  lines.push(`Year,Month,${HEAD}`);
  for (const y of years) {
    lines.push(`${y.year},All year,${nums(y.totals)}`);
    y.months.forEach((m, i) => lines.push(`${y.year},${MONTH_LABELS[i]},${nums(m)}`));
  }
  lines.push("");
  lines.push("SAVED SNAPSHOTS");
  lines.push(`Year,Type,Saved at (UTC),Saved by,Note,${HEAD}`);
  for (const s of snapshots) {
    lines.push(
      [s.year, s.kind === "final" ? "Year end" : "Manual", s.savedAt, csvCell(s.savedBy), csvCell(s.note), nums(s.totals)].join(",")
    );
  }

  const stamp = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" }).format(new Date());
  return new Response("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="revenue-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
