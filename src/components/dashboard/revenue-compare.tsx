import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Totals, YearSummary } from "@/lib/data/hires";
import type { SnapshotRow } from "@/lib/data/revenue-snapshots";
import { cn, formatDateTime, formatNpr } from "@/lib/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Percentage change badge; "new" when there is nothing to compare against. */
export function Change({ now, before }: { now: number; before: number | null }) {
  if (before === null) return <span className="text-xs text-muted-foreground">—</span>;
  if (before === 0) {
    return now > 0 ? <span className="text-xs font-medium text-emerald-700">new</span> : <span className="text-xs text-muted-foreground">0%</span>;
  }
  const pct = ((now - before) / before) * 100;
  const Icon = pct > 0.5 ? ArrowUpRight : pct < -0.5 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 whitespace-nowrap text-xs font-semibold tabular",
        pct > 0.5 ? "text-emerald-700" : pct < -0.5 ? "text-red-700" : "text-muted-foreground"
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {pct > 0 ? "+" : ""}
      {pct.toFixed(Math.abs(pct) < 10 ? 1 : 0)}%
    </span>
  );
}

/** The snapshot to compare a year against: its year-end copy, else the latest manual one. */
function referenceSnapshot(year: string, snapshots: SnapshotRow[]) {
  const forYear = snapshots.filter((s) => s.year === year);
  return forYear.find((s) => s.kind === "final") ?? forYear[0] ?? null;
}

const th = "py-2 pl-3 text-right font-medium whitespace-nowrap";
const td = "py-2.5 pl-3 text-right tabular whitespace-nowrap";

export function YearComparison({ years, snapshots }: { years: YearSummary[]; snapshots: SnapshotRow[] }) {
  // Include years that only exist as snapshots (e.g. records later deleted).
  const allYears = [...new Set([...years.map((y) => y.year), ...snapshots.map((s) => s.year)])].sort((a, b) => b.localeCompare(a));
  if (!allYears.length) return <p className="py-6 text-center text-sm text-muted-foreground">Nothing recorded yet.</p>;

  const live = new Map(years.map((y) => [y.year, y.totals]));
  const empty: Totals = { hires: 0, tutors: 0, salary: 0, commission: 0, demos: 0, deposits: 0, collected: 0 };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-medium">Year</th>
            <th scope="col" className={th}>Hired</th>
            <th scope="col" className={th}>Commission</th>
            <th scope="col" className={th}>Demos</th>
            <th scope="col" className={th}>Demo deposits</th>
            <th scope="col" className={th}>Total collected</th>
            <th scope="col" className={th}>vs previous year</th>
            <th scope="col" className="py-2 pl-4 text-left font-medium">Saved copy</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {allYears.map((year, i) => {
            const t = live.get(year) ?? empty;
            const prevYear = allYears[i + 1];
            const prev = prevYear ? (live.get(prevYear) ?? referenceSnapshot(prevYear, snapshots)?.totals ?? null) : null;
            const snap = referenceSnapshot(year, snapshots);
            const diff = snap ? t.collected - snap.totals.collected : 0;
            return (
              <tr key={year}>
                <th scope="row" className="py-2.5 pr-3 text-left font-semibold">{year}</th>
                <td className={td}>{t.hires}</td>
                <td className={td}>{formatNpr(t.commission)}</td>
                <td className={td}>{t.demos}</td>
                <td className={td}>{formatNpr(t.deposits)}</td>
                <td className={cn(td, "font-semibold text-emerald-700")}>{formatNpr(t.collected)}</td>
                <td className={td}>
                  <Change now={t.collected} before={prev ? prev.collected : null} />
                </td>
                <td className="py-2.5 pl-4 text-xs">
                  {snap ? (
                    <span className="flex flex-col">
                      <span className="font-medium">
                        {formatNpr(snap.totals.collected)}{" "}
                        <span className="font-normal text-muted-foreground">
                          · {snap.kind === "final" ? "year end" : "manual"}, {formatDateTime(snap.savedAt)}
                        </span>
                      </span>
                      {diff === 0 ? (
                        <span className="text-emerald-700">Matches live figures</span>
                      ) : (
                        <span className="text-amber-700">
                          Live is {diff > 0 ? "higher" : "lower"} by {formatNpr(Math.abs(diff))} — records changed since saving
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not saved yet</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function MonthComparison({ thisYear, lastYear }: { thisYear: YearSummary | null; lastYear: YearSummary | null }) {
  const a = lastYear?.months;
  const b = thisYear?.months;
  const sum = (m?: Totals[]) => (m ? m.reduce((s, x) => s + x.collected, 0) : 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-medium">Month</th>
            <th scope="col" className={th}>{lastYear?.year ?? "Last year"} collected</th>
            <th scope="col" className={th}>{thisYear?.year ?? "This year"} collected</th>
            <th scope="col" className={th}>Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {MONTHS.map((label, i) => {
            const before = a?.[i]?.collected ?? 0;
            const now = b?.[i]?.collected ?? 0;
            return (
              <tr key={label} className={before === 0 && now === 0 ? "text-muted-foreground" : undefined}>
                <td className="py-2 pr-3">{label}</td>
                <td className={td}>{formatNpr(before)}</td>
                <td className={cn(td, now > 0 && "font-semibold text-emerald-700")}>{formatNpr(now)}</td>
                <td className={td}>
                  <Change now={now} before={a ? before : null} />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border-strong font-semibold">
            <td className="py-2 pr-3">Total</td>
            <td className={td}>{formatNpr(sum(a))}</td>
            <td className={cn(td, "text-emerald-700")}>{formatNpr(sum(b))}</td>
            <td className={td}>
              <Change now={sum(b)} before={a ? sum(a) : null} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function SnapshotHistory({ snapshots }: { snapshots: SnapshotRow[] }) {
  if (!snapshots.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No snapshots yet. Finished years are saved automatically; use Save snapshot to keep a copy of the current year.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-medium">Year</th>
            <th scope="col" className="py-2 pr-3 font-medium">Type</th>
            <th scope="col" className="py-2 pr-3 font-medium">Saved</th>
            <th scope="col" className={th}>Hired</th>
            <th scope="col" className={th}>Commission</th>
            <th scope="col" className={th}>Deposits</th>
            <th scope="col" className={th}>Total collected</th>
            <th scope="col" className="py-2 pl-4 font-medium">Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {snapshots.map((s) => (
            <tr key={s.id}>
              <td className="py-2.5 pr-3 font-semibold">{s.year}</td>
              <td className="py-2.5 pr-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-px text-[11px] font-semibold",
                    s.kind === "final" ? "bg-violet-100 text-violet-800" : "bg-surface-muted text-foreground"
                  )}
                >
                  {s.kind === "final" ? "Year end" : "Manual"}
                </span>
              </td>
              <td className="py-2.5 pr-3 whitespace-nowrap text-muted-foreground">
                {formatDateTime(s.savedAt)}
                {s.savedBy && <span className="block text-xs">{s.savedBy}</span>}
              </td>
              <td className={td}>{s.totals.hires}</td>
              <td className={td}>{formatNpr(s.totals.commission)}</td>
              <td className={td}>{formatNpr(s.totals.deposits)}</td>
              <td className={cn(td, "font-semibold")}>{formatNpr(s.totals.collected)}</td>
              <td className="py-2.5 pl-4 text-muted-foreground">{s.note || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
