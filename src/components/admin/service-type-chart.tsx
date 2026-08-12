"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ServiceTypeCount } from "@/lib/admin/analytics-queries";

const LABELS: Record<string, string> = { bike: "Bike", car: "Car", parcel: "Parcel" };
const COLORS: Record<string, string> = { bike: "var(--primary)", car: "var(--chart-2, #f59e0b)", parcel: "var(--chart-3, #6366f1)" };

export function ServiceTypeChart({ data }: { data: ServiceTypeCount[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return <p className="flex h-52 items-center justify-center text-sm text-muted-foreground">No completed rides yet</p>;
  }

  return (
    <div className="flex h-52 items-center gap-4">
      <div className="h-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="serviceType" innerRadius={45} outerRadius={75} paddingAngle={2}>
              {data.map((entry) => (
                <Cell key={entry.serviceType} fill={COLORS[entry.serviceType] ?? "var(--muted-foreground)"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} rides`, LABELS[String(name)] ?? String(name)]}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 text-sm">
        {data.map((entry) => (
          <div key={entry.serviceType} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ background: COLORS[entry.serviceType] ?? "var(--muted-foreground)" }}
            />
            <span className="text-muted-foreground">{LABELS[entry.serviceType] ?? entry.serviceType}</span>
            <span className="font-medium">{Math.round((entry.count / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
