import Link from "next/link";
import { cn } from "@/lib/utils";

export type BarListItem = { label: React.ReactNode; key: string; value: number; href?: string };

/**
 * Horizontal magnitude bars in plain HTML (one hue). Labels and values use
 * text colours; the bar only carries magnitude. Each row is a real link/row,
 * so the data is readable without the graphic.
 */
export function BarList({ items, empty = "No data yet", total }: { items: BarListItem[]; empty?: string; total?: number }) {
  if (!items.length) return <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  const sum = total ?? items.reduce((s, i) => s + i.value, 0);

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const pct = sum ? Math.round((item.value / sum) * 100) : 0;
        const inner = (
          <>
            <span
              aria-hidden
              className="absolute inset-y-1 left-0 rounded-md bg-primary-soft transition-colors group-hover:bg-[#e1e9f4]"
              style={{ width: item.value ? `${Math.max((item.value / max) * 100, 2)}%` : 0 }}
            />
            <span className="relative min-w-0 flex-1 truncate pl-2.5 text-sm text-foreground">{item.label}</span>
            <span className="relative shrink-0 text-sm font-medium text-foreground tabular">{item.value}</span>
            <span className="relative w-10 shrink-0 text-right text-xs text-muted-foreground tabular">{pct}%</span>
          </>
        );
        const cls = cn("group relative flex h-9 items-center gap-3 rounded-md pr-1");
        return (
          <li key={item.key}>
            {item.href ? (
              <Link href={item.href} className={cn(cls, "hover:bg-surface-muted/60")} title={`${item.value} tutors`}>
                {inner}
              </Link>
            ) : (
              <div className={cls}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
