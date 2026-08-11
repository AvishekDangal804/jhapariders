import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RideStatus } from "@/types";

const STATUS_LABEL: Record<RideStatus, string> = {
  searching: "Searching",
  driver_assigned: "Rider Assigned",
  driver_arriving: "Rider Arriving",
  driver_arrived: "Rider Arrived",
  ride_started: "In Progress",
  ride_completed: "Completed",
  payment_pending: "Payment Pending",
  paid: "Paid",
  cancelled: "Cancelled",
  no_driver_found: "No Rider Found",
};

const STATUS_STYLE: Record<RideStatus, string> = {
  searching: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  driver_assigned: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
  driver_arriving: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
  driver_arrived: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
  ride_started: "bg-primary/10 text-primary",
  ride_completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  payment_pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  cancelled: "bg-destructive/10 text-destructive",
  no_driver_found: "bg-destructive/10 text-destructive",
};

export function RideStatusBadge({ status, className }: { status: RideStatus; className?: string }) {
  return (
    <Badge variant="secondary" className={cn("border-0", STATUS_STYLE[status], className)}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
