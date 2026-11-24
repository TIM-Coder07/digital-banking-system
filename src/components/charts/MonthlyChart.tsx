"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompactMoney, formatMoney, formatMonth } from "@/lib/format";

type Series = { key: string; label: string; color: string };

/** Grouped monthly bars. Values are paisa. */
export function MonthlyChart({ data, series, height = 280, money = true }: { data: Record<string, number | string>[]; series: Series[]; height?: number; money?: boolean }) {
  const fmt = (v: number) => (money ? formatMoney(v) : String(v));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-white/5" />
        <XAxis dataKey="month" tickFormatter={(v: string) => formatMonth(v)} tickLine={false} axisLine={false} fontSize={12} className="fill-slate-500" />
        <YAxis tickFormatter={(v: number) => (money ? formatCompactMoney(v) : String(v))} allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={64} />
        <Tooltip
          cursor={{ fill: "rgba(148,163,184,0.08)" }}
          formatter={(v: number, name: string) => [fmt(v), name]}
          labelFormatter={(v: string) => formatMonth(v)}
          contentStyle={{ borderRadius: 12, border: "1px solid rgba(148,163,184,0.2)", fontSize: 12 }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={28} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
