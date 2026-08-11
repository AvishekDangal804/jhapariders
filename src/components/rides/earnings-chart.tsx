"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { formatNpr } from "@/lib/fare";
import type { DailyEarning } from "@/lib/earnings/queries";

export function EarningsChart({ data }: { data: DailyEarning[] }) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            className="text-xs fill-muted-foreground"
          />
          <Tooltip
            cursor={{ fill: "var(--accent)" }}
            formatter={(value) => [formatNpr(Number(value ?? 0)), "Earnings"]}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
