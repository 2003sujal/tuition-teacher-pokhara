import Link from "next/link";
import { Users, Inbox, UserCheck, PhoneOutgoing, BadgeCheck, Archive } from "lucide-react";
import type { StatusCounts } from "@/lib/data/tutors";

const CARDS = [
  { key: "total", label: "Total Registered Tutors", icon: Users, href: "/admin/tutors" },
  { key: "New", label: "New Applications", icon: Inbox, href: "/admin/applications" },
  { key: "Available", label: "Available Tutors", icon: UserCheck, href: "/admin/tutors?status=Available" },
  { key: "Contacted", label: "Contacted Tutors", icon: PhoneOutgoing, href: "/admin/tutors?status=Contacted" },
  { key: "Hired", label: "Hired Tutors", icon: BadgeCheck, href: "/admin/tutors?status=Hired" },
  { key: "Archived", label: "Archived Tutors", icon: Archive, href: "/admin/tutors?status=Archived" },
] as const;

export function StatCards({ counts, linked = true }: { counts: StatusCounts; linked?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
      {CARDS.map((c) => {
        const value = counts[c.key];
        const body = (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-medium leading-snug text-muted-foreground">{c.label}</p>
              <c.icon className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
            </div>
            <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular">{value.toLocaleString("en-IN")}</p>
          </>
        );
        const cls = "rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5";
        return linked ? (
          <Link key={c.key} href={c.href} className={`${cls} transition-colors hover:border-border-strong hover:shadow-sm`}>
            {body}
          </Link>
        ) : (
          <div key={c.key} className={cls}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
