"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, BookOpen, X, Download, Loader2 } from "lucide-react";
import { COMMON_SUBJECTS, SORT_OPTIONS, TUTOR_STATUSES } from "@/lib/constants";
import { Input, NativeSelect } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TutorsToolbar({ lockStatus }: { lockStatus?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [location, setLocation] = useState(params.get("location") ?? "");
  const [subject, setSubject] = useState(params.get("subject") ?? "");

  function apply(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page"); // any filter change resets pagination
    startTransition(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  }

  // Debounce free-text inputs.
  useEffect(() => {
    if (
      (params.get("q") ?? "") === q &&
      (params.get("location") ?? "") === location &&
      (params.get("subject") ?? "") === subject
    )
      return;
    const t = setTimeout(
      () => apply({ q: q.trim() || null, location: location.trim() || null, subject: subject.trim() || null }),
      350
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, location, subject]);

  // Keep inputs in sync when the URL changes elsewhere (sidebar links, Clear).
  const qParam = params.get("q") ?? "";
  const locParam = params.get("location") ?? "";
  const subParam = params.get("subject") ?? "";
  const [synced, setSynced] = useState({ q: qParam, location: locParam, subject: subParam });
  if (synced.q !== qParam || synced.location !== locParam || synced.subject !== subParam) {
    setSynced({ q: qParam, location: locParam, subject: subParam });
    setQ(qParam);
    setLocation(locParam);
    setSubject(subParam);
  }

  const hasFilters = ["q", "location", "subject", "status", "from", "to", "sort"].some((k) => params.get(k) && !(lockStatus && k === "status"));
  const exportParams = new URLSearchParams(params.toString());
  exportParams.delete("page");
  if (lockStatus) exportParams.set("status", "New");

  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-card">
      <div className="flex flex-wrap gap-2.5">
        <div className="relative min-w-0 basis-full sm:basis-72 sm:flex-[2]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, mobile, ID or subject"
            className="pl-9"
            aria-label="Search tutors"
            type="search"
          />
        </div>
        <div className="relative min-w-0 basis-full sm:basis-52 sm:flex-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" aria-hidden />
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Filter by location"
            className="pl-9"
            aria-label="Filter by location"
            list="ttp-locations"
          />
          <datalist id="ttp-locations">
            {["Lakeside", "Chipledhunga", "New Road", "Birauta", "Mahendrapool", "Baglung Buspark", "Prithvi Chowk", "Bagar", "Pokhara"].map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>
        <div className="relative min-w-0 basis-full sm:basis-48 sm:flex-1">
          <BookOpen className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" aria-hidden />
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Filter by subject"
            className="pl-9"
            aria-label="Filter by subject"
            list="ttp-subjects"
          />
          <datalist id="ttp-subjects">
            {COMMON_SUBJECTS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        {!lockStatus && (
          <NativeSelect
            aria-label="Filter by status"
            value={params.get("status") ?? ""}
            onChange={(e) => apply({ status: e.target.value || null })}
            className="w-full sm:w-40"
          >
            <option value="">All active</option>
            {TUTOR_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect>
        )}
        <div className="flex w-full items-center gap-1.5 sm:w-auto">
          <Input
            type="date"
            aria-label="Registered from"
            value={params.get("from") ?? ""}
            max={params.get("to") ?? undefined}
            onChange={(e) => apply({ from: e.target.value || null })}
            className="min-w-0 flex-1 sm:w-[9.5rem] sm:flex-none"
          />
          <span className="text-xs text-subtle-foreground">to</span>
          <Input
            type="date"
            aria-label="Registered to"
            value={params.get("to") ?? ""}
            min={params.get("from") ?? undefined}
            onChange={(e) => apply({ to: e.target.value || null })}
            className="min-w-0 flex-1 sm:w-[9.5rem] sm:flex-none"
          />
        </div>
        <NativeSelect
          aria-label="Sort"
          value={params.get("sort") ?? "newest"}
          onChange={(e) => apply({ sort: e.target.value === "newest" ? null : e.target.value })}
          className="w-full sm:w-48"
        >
          {Object.entries(SORT_OPTIONS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </NativeSelect>
        <div className="flex items-center gap-1.5">
          {hasFilters && (
            <Button
              variant="ghost"
              onClick={() => {
                setQ("");
                setLocation("");
                setSubject("");
                startTransition(() => router.replace(pathname, { scroll: false }));
              }}
            >
              <X aria-hidden /> Clear
            </Button>
          )}
          <Button asChild variant="secondary">
            <a href={`/api/tutors/export?${exportParams}`} download>
              <Download aria-hidden /> CSV
            </a>
          </Button>
          {pending && <Loader2 className="size-4 animate-spin text-subtle-foreground" aria-label="Loading" />}
        </div>
      </div>
    </div>
  );
}
