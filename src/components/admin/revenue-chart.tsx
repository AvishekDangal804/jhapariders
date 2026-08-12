"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNpr } from "@/lib/fare";
import type { RevenueDay } from "@/lib/admin/analytics-queries";

export function RevenueChart({ data }: { data: RevenueDay[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={56}
            className="text-xs fill-muted-foreground"
            tickFormatter={(v) => `Rs.${v}`}
          />
          <Tooltip
            formatter={(value, name) => [formatNpr(Number(value)), name === "revenue" ? "Revenue" : "Commission"]}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend
            formatter={(value) => (value === "revenue" ? "Revenue" : "Commission")}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="commission" stroke="var(--chart-2, #f59e0b)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
