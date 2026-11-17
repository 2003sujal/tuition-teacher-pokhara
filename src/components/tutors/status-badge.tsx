import { cn } from "@/lib/utils";
import type { TutorStatus } from "@/lib/constants";

const STYLES: Record<TutorStatus, { dot: string; badge: string }> = {
  New: { dot: "bg-blue-600", badge: "bg-blue-50 text-blue-800 ring-blue-200" },
  Available: { dot: "bg-emerald-600", badge: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  Contacted: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-800 ring-amber-200" },
  Hired: { dot: "bg-violet-600", badge: "bg-violet-50 text-violet-800 ring-violet-200" },
  Unavailable: { dot: "bg-slate-400", badge: "bg-slate-100 text-slate-700 ring-slate-200" },
  Archived: { dot: "bg-stone-400", badge: "bg-stone-100 text-stone-600 ring-stone-200" },
};

export function StatusBadge({ status, className }: { status: TutorStatus; className?: string }) {
  const s = STYLES[status] ?? STYLES.New;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        s.badge,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} aria-hidden />
      {status}
    </span>
  );
}
