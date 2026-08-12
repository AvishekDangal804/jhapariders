"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { UserGrowthDay } from "@/lib/admin/analytics-queries";

export function UserGrowthChart({ data }: { data: UserGrowthDay[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
          <YAxis axisLine={false} tickLine={false} width={28} allowDecimals={false} className="text-xs fill-muted-foreground" />
          <Tooltip
            formatter={(value, name) => [String(value), name === "passengers" ? "Passengers" : "Riders"]}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend
            formatter={(value) => (value === "passengers" ? "Passengers" : "Riders")}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="passengers" stackId="a" fill="var(--primary)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="riders" stackId="a" fill="var(--chart-2, #f59e0b)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
