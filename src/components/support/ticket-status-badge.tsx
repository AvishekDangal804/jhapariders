import { Badge } from "@/components/ui/badge";
import type { SupportTicketStatus } from "@/types";

const VARIANT: Record<SupportTicketStatus, "outline" | "secondary" | "default"> = {
  open: "default",
  in_progress: "secondary",
  resolved: "outline",
  closed: "outline",
};

export function TicketStatusBadge({ status }: { status: SupportTicketStatus }) {
  return (
    <Badge variant={VARIANT[status]} className="capitalize">
      {status.replace("_", " ")}
    </Badge>
  );
}
