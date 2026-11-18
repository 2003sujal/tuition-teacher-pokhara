import Link from "next/link";
import { FileText, FileCheck2, Download, ChevronLeft, ChevronRight, SearchX, Inbox } from "lucide-react";
import type { TutorRow } from "@/lib/data/tutors";
import { formatMobile } from "@/lib/phone";
import { formatBytes, formatDate } from "@/lib/utils";
import { PAGE_SIZE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { RowActions } from "./row-actions";

/** Small "agreement signed" tick next to a tutor's name. */
function AgreedMark({ at }: { at: string | null }) {
  if (!at) return null;
  return (
    <span
      className="ml-1.5 inline-flex items-center gap-0.5 align-middle text-[11px] font-medium text-emerald-700"
      title={`Service agreement accepted ${formatDate(at)}`}
    >
      <FileCheck2 className="size-3.5" aria-hidden />
      Agreed
    </span>
  );
}

export function SubjectTags({ subjects, max = 2 }: { subjects: string[]; max?: number }) {
  if (!subjects.length) return <span className="text-subtle-foreground">—</span>;
  const shown = subjects.slice(0, max);
  const rest = subjects.length - shown.length;
  return (
    <span className="flex flex-wrap items-center gap-1" title={subjects.join(", ")}>
      {shown.map((s) => (
        <span key={s} className="whitespace-nowrap rounded-md bg-surface-muted px-1.5 py-0.5 text-xs text-foreground">
          {s}
        </span>
      ))}
      {rest > 0 && <span className="text-xs text-muted-foreground">+{rest}</span>}
    </span>
  );
}

function CvLink({ t }: { t: TutorRow }) {
  return (
    <div className="flex items-center gap-1">
      <a
        href={`/api/tutors/${t.id}/cv`}
        target="_blank"
        rel="noopener"
        className="inline-flex max-w-40 items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] text-primary hover:bg-primary-soft"
        title={`${t.cvFileName} · ${formatBytes(t.cvFileSize)}`}
      >
        <FileText className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{t.cvFileName}</span>
      </a>
      <a
        href={`/api/tutors/${t.id}/cv?download=1`}
        className="rounded-md p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
        aria-label={`Download CV of ${t.fullName}`}
        title="Download CV"
      >
        <Download className="size-3.5" />
      </a>
    </div>
  );
}

export function TutorsTable({
  items,
  total,
  page,
  pageCount,
  searchParams,
  basePath,
  filtered,
}: {
  items: TutorRow[];
  total: number;
  page: number;
  pageCount: number;
  searchParams: Record<string, string>;
  basePath: string;
  filtered: boolean;
}) {
  const pageHref = (p: number) => {
    const sp = new URLSearchParams(searchParams);
    if (p > 1) sp.set("page", String(p));
    else sp.delete("page");
    return `${basePath}${sp.size ? `?${sp}` : ""}`;
  };

  if (items.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-surface-muted text-muted-foreground">
          {filtered ? <SearchX className="size-5" aria-hidden /> : <Inbox className="size-5" aria-hidden />}
        </span>
        <p className="mt-4 text-sm font-semibold">{filtered ? "No tutors match your filters" : "No tutor records yet"}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {filtered
            ? "Try a different name, number or location, or clear the filters."
            : "Once tutors submit the registration form, they will appear here."}
        </p>
        {filtered && (
          <Button asChild variant="secondary" className="mt-5">
            <Link href={basePath}>Clear filters</Link>
          </Button>
        )}
      </div>
    );
  }

  const from = (page - 1) * PAGE_SIZE + 1;
  const to = from + items.length - 1;

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="border-b border-border bg-surface-muted/60 text-xs font-medium text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Application ID</th>
              <th scope="col" className="px-4 py-3 font-medium">Full name</th>
              <th scope="col" className="px-4 py-3 font-medium">Mobile</th>
              <th scope="col" className="px-4 py-3 font-medium">Location</th>
              <th scope="col" className="px-4 py-3 font-medium">Subjects</th>
              <th scope="col" className="px-4 py-3 font-medium">CV / Resume</th>
              <th scope="col" className="px-4 py-3 font-medium">Registered</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((t) => (
              <tr key={t.id} className="transition-colors hover:bg-surface-muted/50">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] text-muted-foreground">{t.applicationId}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/tutors/${t.id}`} className="font-medium text-foreground hover:text-primary">
                    {t.fullName}
                  </Link>
                  <AgreedMark at={t.agreementAcceptedAt} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular text-foreground">{formatMobile(t.normalizedMobileNumber)}</td>
                <td className="max-w-40 truncate px-4 py-3 text-foreground" title={t.location}>{t.location}</td>
                <td className="max-w-56 px-4 py-3"><SubjectTags subjects={t.subjects} /></td>
                <td className="px-4 py-2"><CvLink t={t} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(t.createdAt)}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-3 py-2 text-right"><RowActions tutor={t} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-border md:hidden">
        {items.map((t) => (
          <li key={t.id} className="flex items-start gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/admin/tutors/${t.id}`} className="truncate font-medium hover:text-primary">
                  {t.fullName}
                </Link>
                <StatusBadge status={t.status} />
                <AgreedMark at={t.agreementAcceptedAt} />
              </div>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {formatMobile(t.normalizedMobileNumber)} · {t.location}
              </p>
              {t.subjects.length > 0 && (
                <div className="mt-1.5">
                  <SubjectTags subjects={t.subjects} max={4} />
                </div>
              )}
              <p className="mt-1 font-mono text-xs text-subtle-foreground">
                {t.applicationId} · {formatDate(t.createdAt)}
              </p>
              <div className="mt-1.5 -ml-1.5">
                <CvLink t={t} />
              </div>
            </div>
            <RowActions tutor={t} />
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm sm:flex-row">
        <p className="text-muted-foreground">
          Showing <span className="font-medium text-foreground tabular">{from}–{to}</span> of{" "}
          <span className="font-medium text-foreground tabular">{total}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button asChild={page > 1} variant="secondary" size="sm" disabled={page <= 1}>
            {page > 1 ? (
              <Link href={pageHref(page - 1)} scroll={false}>
                <ChevronLeft aria-hidden /> Previous
              </Link>
            ) : (
              <>
                <ChevronLeft aria-hidden /> Previous
              </>
            )}
          </Button>
          <span className="px-1 text-muted-foreground tabular">
            Page {page} of {pageCount}
          </span>
          <Button asChild={page < pageCount} variant="secondary" size="sm" disabled={page >= pageCount}>
            {page < pageCount ? (
              <Link href={pageHref(page + 1)} scroll={false}>
                Next <ChevronRight aria-hidden />
              </Link>
            ) : (
              <>
                Next <ChevronRight aria-hidden />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
