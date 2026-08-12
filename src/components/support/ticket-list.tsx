import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { TicketStatusBadge } from "./ticket-status-badge";
import type { SupportTicketRow } from "@/lib/support/queries";

const CATEGORY_LABEL: Record<string, string> = {
  ride_problem: "Ride problem",
  payment_problem: "Payment problem",
  rider_problem: "Rider problem",
  passenger_problem: "Passenger problem",
  account_problem: "Account problem",
  safety_issue: "Safety issue",
};

export function TicketList({
  tickets,
  basePath,
  showRequester = false,
}: {
  tickets: SupportTicketRow[];
  basePath: string;
  showRequester?: boolean;
}) {
  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={LifeBuoy}
        title="No support tickets"
        description="Questions or issues you report will show up here."
        className="mt-8"
      />
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {tickets.map((t) => (
        <Link
          key={t.id}
          href={`${basePath}/${t.id}`}
          className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm hover:bg-accent/50"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{t.subject}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {CATEGORY_LABEL[t.category] ?? t.category}
              {showRequester && t.userName ? ` · ${t.userName}` : ""}
              {" · "}
              {new Date(t.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
          <TicketStatusBadge status={t.status} />
        </Link>
      ))}
    </div>
  );
}
