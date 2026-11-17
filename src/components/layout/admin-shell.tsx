"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Inbox,
  UserCheck,
  PhoneOutgoing,
  BadgeCheck,
  Archive,
  BarChart3,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { BrandMark } from "./brand";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CurrentAdmin } from "@/lib/auth";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (path: string, status: string | null) => boolean;
  countKey?: "New";
};

const NAV: { heading?: string; items: NavItem[] }[] = [
  {
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, match: (p) => p === "/admin/dashboard" },
      {
        label: "All Tutors",
        href: "/admin/tutors",
        icon: Users,
        match: (p, s) => (p === "/admin/tutors" && !s) || /^\/admin\/tutors\/[^/]+$/.test(p),
      },
      {
        label: "New Applications",
        href: "/admin/applications",
        icon: Inbox,
        match: (p) => p === "/admin/applications",
        countKey: "New",
      },
    ],
  },
  {
    heading: "By status",
    items: [
      { label: "Available Tutors", href: "/admin/tutors?status=Available", icon: UserCheck, match: (p, s) => p === "/admin/tutors" && s === "Available" },
      { label: "Contacted Tutors", href: "/admin/tutors?status=Contacted", icon: PhoneOutgoing, match: (p, s) => p === "/admin/tutors" && s === "Contacted" },
      { label: "Hired Tutors", href: "/admin/tutors?status=Hired", icon: BadgeCheck, match: (p, s) => p === "/admin/tutors" && s === "Hired" },
      { label: "Archived Tutors", href: "/admin/tutors?status=Archived", icon: Archive, match: (p, s) => p === "/admin/tutors" && s === "Archived" },
    ],
  },
  {
    heading: "Insights",
    items: [
      { label: "Reports & Analytics", href: "/admin/reports", icon: BarChart3, match: (p) => p === "/admin/reports" },
      { label: "Settings", href: "/admin/settings", icon: Settings, match: (p) => p === "/admin/settings" },
    ],
  },
];

const CRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  tutors: "Tutors",
  applications: "New Applications",
  reports: "Reports & Analytics",
  settings: "Settings",
};

// Sidebar collapsed state persisted per browser (a convenience; safe if storage is blocked).
const sidebarListeners = new Set<() => void>();
function readSidebar() {
  try {
    return localStorage.getItem("ttp:sidebar") === "collapsed";
  } catch {
    return false;
  }
}
function writeSidebar(collapsed: boolean) {
  try {
    localStorage.setItem("ttp:sidebar", collapsed ? "collapsed" : "expanded");
  } catch {}
  sidebarListeners.forEach((l) => l());
}
function subscribeSidebar(listener: () => void) {
  sidebarListeners.add(listener);
  return () => sidebarListeners.delete(listener);
}

function useLogout() {
  const router = useRouter();
  return async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
    router.refresh();
  };
}

function SidebarNav({
  collapsed,
  newCount,
  onNavigate,
}: {
  collapsed: boolean;
  newCount: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const status = useSearchParams().get("status");
  const logout = useLogout();

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4" aria-label="Admin">
      {NAV.map((group, gi) => (
        <div key={gi} className="space-y-0.5">
          {group.heading && !collapsed && (
            <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              {group.heading}
            </p>
          )}
          {group.heading && collapsed && <div className="mx-2 mb-2 h-px bg-border" />}
          {group.items.map((item) => {
            const active = item.match(pathname, status);
            const count = item.countKey === "New" ? newCount : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                <item.icon className={cn("size-[18px] shrink-0", active ? "text-primary" : "text-subtle-foreground group-hover:text-foreground")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {count > 0 &&
                  (collapsed ? (
                    <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-surface" aria-label={`${count} new`} />
                  ) : (
                    <span className="ml-auto rounded-full bg-primary px-1.5 py-px text-[11px] font-semibold text-white tabular">
                      {count > 99 ? "99+" : count}
                    </span>
                  ))}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="mt-auto border-t border-border pt-3">
        <button
          type="button"
          onClick={logout}
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger cursor-pointer",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="size-[18px] shrink-0" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </nav>
  );
}

function Breadcrumbs() {
  const pathname = usePathname();
  const status = useSearchParams().get("status");
  const parts = pathname.split("/").filter(Boolean).slice(1); // drop "admin"

  const crumbs: { label: string; href?: string }[] = [{ label: "Admin", href: "/admin/dashboard" }];
  parts.forEach((part, i) => {
    const href = "/admin/" + parts.slice(0, i + 1).join("/");
    const isLast = i === parts.length - 1;
    const label = CRUMB_LABELS[part] ?? (parts[0] === "tutors" ? "Profile" : part);
    crumbs.push({ label, href: isLast ? undefined : href });
  });
  if (pathname === "/admin/tutors" && status) {
    crumbs[crumbs.length - 1]!.href = "/admin/tutors";
    crumbs.push({ label: status });
  }

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1 text-sm">
        {crumbs.map((c, i) => (
          <li key={i} className={cn("flex min-w-0 items-center gap-1", i < crumbs.length - 2 && "hidden sm:flex")}>
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-subtle-foreground" aria-hidden />}
            {c.href ? (
              <Link href={c.href} className="truncate text-muted-foreground hover:text-foreground">
                {c.label}
              </Link>
            ) : (
              <span className="truncate font-medium text-foreground" aria-current="page">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function AdminShell({
  admin,
  agencyName,
  logo,
  newCount,
  children,
}: {
  admin: CurrentAdmin;
  agencyName: string;
  logo: string;
  newCount: number;
  children: React.ReactNode;
}) {
  const collapsed = useSyncExternalStore(subscribeSidebar, readSidebar, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const logout = useLogout();

  // Close the mobile drawer whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  function toggle() {
    writeSidebar(!collapsed);
  }

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 lg:flex",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        <div className={cn("flex h-16 items-center gap-2.5 border-b border-border px-4", collapsed && "justify-center px-0")}>
          <BrandMark logo={logo} />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold tracking-tight">{agencyName}</p>
              <p className="text-xs text-muted-foreground">Tutor database</p>
            </div>
          )}
        </div>
        <SidebarNav collapsed={collapsed} newCount={newCount} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-surface shadow-pop">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2.5">
                <BrandMark logo={logo} />
                <p className="text-sm font-semibold tracking-tight">{agencyName}</p>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
                <X />
              </Button>
            </div>
            <SidebarNav collapsed={false} newCount={newCount} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md sm:px-6">
          <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
            <Menu />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggle}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
          <div className="hidden h-5 w-px bg-border lg:block" />
          <Breadcrumbs />

          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <a href="/apply" target="_blank" rel="noopener">
                <ExternalLink aria-hidden />
                View form
              </a>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer">
                  <span className="grid size-8 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    {initials(admin.name) || "A"}
                  </span>
                  <span className="hidden text-left leading-tight sm:block">
                    <span className="block max-w-36 truncate text-[13px] font-medium">{admin.name}</span>
                    <span className="block text-[11px] text-muted-foreground">Administrator</span>
                  </span>
                  <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <span className="block truncate text-foreground">{admin.name}</span>
                  <span className="block truncate font-normal">{admin.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <Settings /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem destructive onSelect={logout}>
                  <LogOut /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
