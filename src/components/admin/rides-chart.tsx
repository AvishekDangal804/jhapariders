"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { DailyRideCount } from "@/lib/admin/overview-queries";

export function RidesChart({ data }: { data: DailyRideCount[] }) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
          <Tooltip
            formatter={(value) => [String(value), "Rides"]}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="rides"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ fill: "var(--primary)", r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
