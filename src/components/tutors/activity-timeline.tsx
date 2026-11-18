import { ArrowRight, Briefcase, FilePlus2, Pencil, RefreshCcw, StickyNote } from "lucide-react";
import type { ActivityItem } from "@/lib/data/tutors";
import type { TutorStatus } from "@/lib/constants";
import { TUTOR_STATUSES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

const ICONS = {
  application_submitted: FilePlus2,
  status_changed: RefreshCcw,
  details_updated: Pencil,
  notes_updated: StickyNote,
  hire_added: Briefcase,
  hire_removed: Briefcase,
} as Record<string, React.ComponentType<{ className?: string }>>;

const isStatus = (v: string): v is TutorStatus => (TUTOR_STATUSES as readonly string[]).includes(v);

function Description({ item }: { item: ActivityItem }) {
  switch (item.action) {
    case "application_submitted":
      return <span>Application submitted via the registration form</span>;
    case "status_changed":
      return (
        <span className="flex flex-wrap items-center gap-1.5">
          Status changed
          {isStatus(item.previousValue) && <StatusBadge status={item.previousValue} />}
          <ArrowRight className="size-3 text-subtle-foreground" aria-label="to" />
          {isStatus(item.newValue) && <StatusBadge status={item.newValue} />}
        </span>
      );
    case "details_updated":
      return <span>Information edited</span>;
    case "notes_updated":
      return <span>Admin notes updated</span>;
    case "hire_added":
      return <span>Hire recorded{item.newValue && <>: <span className="font-medium">{item.newValue}</span></>}</span>;
    case "hire_removed":
      return <span>Hire record removed{item.previousValue && <>: {item.previousValue}</>}</span>;
    default:
      return <span>{item.action.replace(/_/g, " ")}</span>;
  }
}

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  return (
    <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-border">
      {items.map((item) => {
        const Icon = ICONS[item.action] ?? RefreshCcw;
        return (
          <li key={item.id} className="relative flex gap-3">
            <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border border-border bg-surface text-muted-foreground">
              <Icon className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0 pt-1 text-sm">
              <Description item={item} />
              {item.action === "details_updated" && item.previousValue && (
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="line-through">{item.previousValue}</span>
                  <br />
                  {item.newValue}
                </p>
              )}
              {item.note && (
                <p className="mt-1.5 rounded-lg bg-surface-muted px-2.5 py-1.5 text-[13px] text-foreground">{item.note}</p>
              )}
              <p className="mt-1 text-xs text-subtle-foreground">
                {formatDateTime(item.createdAt)}
                {item.adminName && ` · by ${item.adminName}`}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
