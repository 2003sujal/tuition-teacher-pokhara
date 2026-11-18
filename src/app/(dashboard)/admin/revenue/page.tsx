import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Presentation } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getRevenueReport, REVENUE_PERIODS, type BreakdownRow, type RevenuePeriod, type Totals } from "@/lib/data/hires";
import { cn, formatDate, formatNpr } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Revenue" };

const isPeriod = (v: unknown): v is RevenuePeriod => typeof v === "string" && v in REVENUE_PERIODS;

function SummaryCard({ label, totals, active, href }: { label: string; totals: Totals; active: boolean; href: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-xl border bg-surface p-4 shadow-card transition-colors sm:p-5",
        active ? "border-primary ring-2 ring-primary/15" : "border-border hover:border-border-strong"
      )}
    >
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-3 text-[26px] font-semibold leading-none tracking-tight text-emerald-700 tabular">
        {formatNpr(totals.collected)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">total collected</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-2 gap-y-3 border-t border-border pt-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Teachers hired</dt>
          <dd className="font-semibold tabular">{totals.hires}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Commission</dt>
          <dd className="font-semibold tabular">{formatNpr(totals.commission)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Demo classes</dt>
          <dd className="font-semibold tabular">{totals.demos}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Demo deposits</dt>
          <dd className="font-semibold tabular">{formatNpr(totals.deposits)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-muted-foreground">Teacher salary (hired)</dt>
          <dd className="font-semibold tabular">{formatNpr(totals.salary)}</dd>
        </div>
      </dl>
    </Link>
  );
}


const SUM_KEYS = ["hires", "salary", "commission", "demos", "deposits", "collected"] as const;

function BreakdownTable({ rows, first }: { rows: BreakdownRow[]; first: string }) {
  const total = Object.fromEntries(SUM_KEYS.map((k) => [k, rows.reduce((s, r) => s + r[k], 0)])) as Record<
    (typeof SUM_KEYS)[number],
    number
  >;
  const th = "py-2 pl-3 text-right font-medium whitespace-nowrap";
  const td = "py-2 pl-3 text-right tabular whitespace-nowrap";
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-medium">{first}</th>
            <th scope="col" className={th}>Hired</th>
            <th scope="col" className={th}>Teacher salary</th>
            <th scope="col" className={th}>Commission</th>
            <th scope="col" className={th}>Demos</th>
            <th scope="col" className={th}>Demo deposits</th>
            <th scope="col" className={th}>Total collected</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.key} className={r.hires === 0 && r.demos === 0 ? "text-muted-foreground" : undefined}>
              <td className="py-2 pr-3 whitespace-nowrap">{r.label}</td>
              <td className={td}>{r.hires}</td>
              <td className={td}>{formatNpr(r.salary)}</td>
              <td className={td}>{formatNpr(r.commission)}</td>
              <td className={td}>{r.demos}</td>
              <td className={td}>{formatNpr(r.deposits)}</td>
              <td className={cn(td, r.collected > 0 && "font-semibold text-emerald-700")}>{formatNpr(r.collected)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="py-6 text-center text-muted-foreground">Nothing recorded yet</td>
            </tr>
          )}
        </tbody>
        {rows.length > 1 && (
          <tfoot>
            <tr className="border-t border-border-strong font-semibold">
              <td className="py-2 pr-3">Total</td>
              <td className={td}>{total.hires}</td>
              <td className={td}>{formatNpr(total.salary)}</td>
              <td className={td}>{formatNpr(total.commission)}</td>
              <td className={td}>{total.demos}</td>
              <td className={td}>{formatNpr(total.deposits)}</td>
              <td className={cn(td, "text-emerald-700")}>{formatNpr(total.collected)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
export default async function RevenuePage({ searchParams }: PageProps<"/admin/revenue">) {
  await requireAdmin();
  const { period: raw } = await searchParams;
  const period: RevenuePeriod = isPeriod(raw) ? raw : "month";
  const report = await getRevenueReport(period);
  const selected = report.summary[period];

  return (
    <>
      <PageHeader
        title="Revenue"
        description="Teachers hired, salary, our commission and demo deposits — by week, month and year (Nepal time)."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {(Object.keys(REVENUE_PERIODS) as RevenuePeriod[]).map((p) => (
          <SummaryCard
            key={p}
            label={REVENUE_PERIODS[p]}
            totals={report.summary[p]}
            active={p === period}
            href={`/admin/revenue?period=${p}`}
          />
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle>Hires &amp; demo classes · {REVENUE_PERIODS[period]}</CardTitle>
            <CardDescription>
              {selected.hires} hire{selected.hires === 1 ? "" : "s"} ({selected.tutors} teacher{selected.tutors === 1 ? "" : "s"}) ·
              commission {formatNpr(selected.commission)} · {selected.demos} demo{selected.demos === 1 ? "" : "s"}, deposits{" "}
              {formatNpr(selected.deposits)} · total collected {formatNpr(selected.collected)}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {report.hires.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium">Nothing recorded in this period</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Change a tutor&apos;s status to <span className="font-medium">Demo</span> or <span className="font-medium">Hired</span> to record the deposit or commission.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {report.hires.map((h) => (
                <li key={h.id} className="flex items-center gap-3 px-5 py-3">
                  {h.posterUrl ? (
                    <a href={h.posterUrl} target="_blank" rel="noopener" className="shrink-0" title="Open vacancy poster">
                      {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary image, already sized */}
                      <img
                        src={h.posterUrl.replace("/upload/", "/upload/c_fill,w_96,h_120,q_auto,f_auto/")}
                        alt={`Vacancy poster: ${h.vacancyTitle}`}
                        className="h-[60px] w-12 rounded-md object-cover ring-1 ring-border"
                      />
                    </a>
                  ) : (
                    <span className="grid h-[60px] w-12 shrink-0 place-items-center rounded-md bg-surface-muted text-subtle-foreground">
                      {h.kind === "demo" ? <Presentation className="size-4" aria-hidden /> : <Briefcase className="size-4" aria-hidden />}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-1.5 py-px text-[10.5px] font-semibold",
                          h.kind === "demo" ? "bg-cyan-100 text-cyan-800" : "bg-violet-100 text-violet-800"
                        )}
                      >
                        {h.kind === "demo" ? "Demo" : "Hired"}
                      </span>
                      <span className="truncate">{h.vacancyTitle}</span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      <Link href={`/admin/tutors/${h.tutorId}`} className="hover:text-primary">
                        {h.tutorName}
                      </Link>
                      {" · "}
                      {formatDate(h.hiredAt)}
                      {h.studentLocation && ` · ${h.studentLocation}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "text-sm font-semibold tabular",
                        h.kind === "demo" && h.refunded ? "text-muted-foreground line-through" : "text-emerald-700"
                      )}
                    >
                      {formatNpr(h.commission)}
                    </p>
                    <p className="text-xs text-muted-foreground tabular">
                      {h.kind === "demo"
                        ? h.refunded
                          ? "deposit refunded"
                          : "demo deposit"
                        : `salary ${formatNpr(h.monthlySalary)}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {report.hireCount > report.hires.length && (
            <p className="px-5 pt-2 text-xs text-muted-foreground">Showing the latest {report.hires.length} of {report.hireCount}.</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Weekly</CardTitle>
              <CardDescription>Last 8 weeks (Sunday–Saturday)</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <BreakdownTable rows={report.weekly} first="Week" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Monthly</CardTitle>
              <CardDescription>Last 12 months</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <BreakdownTable rows={report.monthly} first="Month" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Yearly</CardTitle>
              <CardDescription>Every year with records</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <BreakdownTable rows={report.yearly} first="Year" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
