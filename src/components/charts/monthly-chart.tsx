"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyPoint } from "@/lib/data/analytics";

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: MonthlyPoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]!.payload;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-pop">
      <p className="font-medium text-foreground">{p.label}</p>
      <p className="mt-0.5 text-muted-foreground">
        <span className="font-semibold text-foreground tabular">{p.count}</span> registration{p.count === 1 ? "" : "s"}
      </p>
    </div>
  );
}

/** Single-series monthly registrations: one hue, thin rounded bars, recessive grid. */
export function MonthlyChart({ data, height = 260 }: { data: MonthlyPoint[]; height?: number }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <figure>
      <div style={{ height }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              interval="preserveStartEnd"
              minTickGap={8}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              width={44}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-muted)" }} />
            <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        Monthly registrations, {total} total: {data.map((d) => `${d.label}: ${d.count}`).join(", ")}
      </figcaption>
    </figure>
  );
}
