import type { Metadata } from "next";
import { Download } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getReport } from "@/lib/data/analytics";
import { dateRangeSchema } from "@/lib/validations";
import { TUTOR_STATUSES } from "@/lib/constants";
import { flatParams, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCards } from "@/components/dashboard/stat-cards";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { MonthlyChart } from "@/components/charts/monthly-chart";
import { BarList } from "@/components/charts/bar-list";
import { StatusBadge } from "@/components/tutors/status-badge";

export const metadata: Metadata = { title: "Reports & Analytics" };

export default async function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireAdmin();
  const range = dateRangeSchema.parse(flatParams(await searchParams));
  const nepalDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" }).format(d);
  const now = new Date();
  const today = nepalDay(now);
  const daysAgo = (n: number) => nepalDay(new Date(now.getTime() - n * 86400000));
  const presets = [
    { label: "All time", from: "", to: "" },
    { label: "30 days", from: daysAgo(30), to: today },
    { label: "90 days", from: daysAgo(90), to: today },
    { label: "12 months", from: daysAgo(365), to: today },
  ];
  const { counts, monthly, locations, subjects } = await getReport(range);

  const rangeLabel =
    range.from || range.to
      ? `${range.from ? formatDate(`${range.from}T12:00:00+05:45`) : "the beginning"} – ${range.to ? formatDate(`${range.to}T12:00:00+05:45`) : "today"}`
      : "All time";
  const exportQs = new URLSearchParams();
  if (range.from) exportQs.set("from", range.from);
  if (range.to) exportQs.set("to", range.to);

  const busiest = monthly.reduce((best, m) => (m.count > (best?.count ?? -1) ? m : best), monthly[0]);
  const avg = monthly.length ? monthly.reduce((s, m) => s + m.count, 0) / monthly.length : 0;

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        description={`Registrations in range: ${rangeLabel}`}
        actions={
          <Button asChild>
            <a href={`/api/tutors/export?${exportQs}`} download>
              <Download aria-hidden /> Export CSV
            </a>
          </Button>
        }
      />

      <div className="mb-5">
        <DateRangeFilter presets={presets} />
      </div>

      <StatCards counts={counts} linked={false} />

      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle>Registration trend</CardTitle>
            <CardDescription>
              Tutors registered per month {range.from || range.to ? "in the selected range" : "over the last 12 months"}
            </CardDescription>
          </div>
          <dl className="flex gap-6 text-right">
            <div>
              <dt className="text-xs text-muted-foreground">Monthly average</dt>
              <dd className="text-lg font-semibold tabular">{avg.toFixed(1)}</dd>
            </div>
            {busiest && busiest.count > 0 && (
              <div>
                <dt className="text-xs text-muted-foreground">Busiest month</dt>
                <dd className="text-lg font-semibold">
                  {busiest.label} <span className="text-sm font-normal text-muted-foreground tabular">({busiest.count})</span>
                </dd>
              </div>
            )}
          </dl>
        </CardHeader>
        <CardContent className="pt-4">
          <MonthlyChart data={monthly} height={300} />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Location-wise distribution</CardTitle>
              <CardDescription>Top {locations.length} locations · click to see those tutors</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <BarList
              total={counts.total}
              items={locations.map((l) => ({
                key: l.location,
                label: l.location,
                value: l.count,
                href: `/admin/tutors?location=${encodeURIComponent(l.location)}`,
              }))}
              empty="No registrations in this range"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Status breakdown</CardTitle>
              <CardDescription>{counts.total} tutors registered in range</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <BarList
              total={counts.total}
              items={TUTOR_STATUSES.map((s) => ({ key: s, label: <StatusBadge status={s} />, value: counts[s] }))}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle>Subject-wise distribution</CardTitle>
            <CardDescription>How many tutors can teach each subject · click to see those tutors</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <BarList
            total={counts.total}
            items={subjects.map((s) => ({
              key: s.subject,
              label: s.subject,
              value: s.count,
              href: `/admin/tutors?subject=${encodeURIComponent(s.subject)}`,
            }))}
            empty="No subjects recorded in this range"
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Percentages are of all tutors in range; a tutor with several subjects is counted under each.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle>Monthly registration count</CardTitle>
            <CardDescription>Table view of the trend above</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2 pr-4 font-medium">Month</th>
                <th scope="col" className="py-2 text-right font-medium">Registrations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...monthly].reverse().map((m) => (
                <tr key={m.key}>
                  <td className="py-2 pr-4">{m.label}</td>
                  <td className="py-2 text-right font-medium tabular">{m.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
