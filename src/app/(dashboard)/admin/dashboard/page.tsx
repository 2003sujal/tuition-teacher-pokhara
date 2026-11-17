import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getRecentTutors, getStatusCounts } from "@/lib/data/tutors";
import { getLocationDistribution, getMonthlyRegistrations } from "@/lib/data/analytics";
import { getSettings, registrationLink } from "@/lib/data/settings";
import { TUTOR_STATUSES } from "@/lib/constants";
import { formatRelative } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { StatCards } from "@/components/dashboard/stat-cards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonthlyChart } from "@/components/charts/monthly-chart";
import { BarList } from "@/components/charts/bar-list";
import { StatusBadge } from "@/components/tutors/status-badge";
import { CopyLinkButton } from "@/components/forms/copy-text";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const [counts, recent, monthly, locations, settings] = await Promise.all([
    getStatusCounts(),
    getRecentTutors(6),
    getMonthlyRegistrations(),
    getLocationDistribution({ status: { $ne: "Archived" } }, 8),
    getSettings(),
  ]);
  const link = registrationLink(settings);
  const firstName = admin.name.split(" ")[0];
  const thisMonth = monthly.at(-1)?.count ?? 0;

  return (
    <>
      <PageHeader
        title={`Namaste, ${firstName}`}
        description="Here's what's happening with your tutor network."
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/admin/tutors">
                <Users aria-hidden /> View all tutors
              </Link>
            </Button>
            <CopyLinkButton url={link} />
          </>
        }
      />

      <StatCards counts={counts} />

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Monthly registrations</CardTitle>
              <CardDescription>Applications received over the last 12 months</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold tabular">{thisMonth}</p>
              <p className="text-xs text-muted-foreground">this month</p>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <MonthlyChart data={monthly} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Status distribution</CardTitle>
              <CardDescription>All {counts.total} tutor records</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <BarList
              total={counts.total}
              items={TUTOR_STATUSES.map((s) => ({
                key: s,
                label: <StatusBadge status={s} />,
                value: counts[s],
                href: s === "New" ? "/admin/applications" : `/admin/tutors?status=${s}`,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Recent registrations</CardTitle>
              <CardDescription>The newest tutors who applied</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/tutors">
                View all <ArrowRight aria-hidden />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            {recent.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium">No registrations yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Share the registration link with tutors to get started.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/admin/tutors/${t.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted/60"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-muted text-muted-foreground">
                        <FileText className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t.location}
                          {t.subjects.length > 0 && ` · ${t.subjects.slice(0, 3).join(", ")}${t.subjects.length > 3 ? "…" : ""}`}
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <StatusBadge status={t.status} />
                      </div>
                      <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
                        {formatRelative(t.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Tutors by location</CardTitle>
              <CardDescription>Top areas (active tutors)</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/reports">Reports</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <BarList
              items={locations.map((l) => ({
                key: l.location,
                label: l.location,
                value: l.count,
                href: `/admin/tutors?location=${encodeURIComponent(l.location)}`,
              }))}
              empty="Locations appear once tutors register"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Public registration link</p>
          <p className="mt-0.5 truncate font-mono text-[13px] text-muted-foreground">{link}</p>
        </div>
        <CopyLinkButton url={link} variant="soft" />
      </Card>
    </>
  );
}
