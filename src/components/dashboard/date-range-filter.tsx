"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type RangePreset = { label: string; from: string; to: string };

export function DateRangeFilter({ presets }: { presets: RangePreset[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  function go(next: { from?: string; to?: string }) {
    const sp = new URLSearchParams();
    if (next.from) sp.set("from", next.from);
    if (next.to) sp.set("to", next.to);
    start(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }));
  }

  const activePreset = presets.find((p) => p.from === from && p.to === to);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 shadow-xs" role="group" aria-label="Date presets">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            aria-pressed={activePreset === p}
            onClick={() => go({ from: p.from, to: p.to })}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer",
              activePreset === p ? "bg-primary-soft text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <Input type="date" aria-label="From" value={from} max={to || undefined} onChange={(e) => go({ from: e.target.value, to })} className="h-9 w-[9.5rem]" />
        <span className="text-xs text-subtle-foreground">to</span>
        <Input type="date" aria-label="To" value={to} min={from || undefined} onChange={(e) => go({ from, to: e.target.value })} className="h-9 w-[9.5rem]" />
      </div>
      {pending && <Loader2 className="size-4 animate-spin text-subtle-foreground" aria-label="Loading" />}
    </div>
  );
}
