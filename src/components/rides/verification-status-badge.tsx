import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/types";

const STYLE: Record<VerificationStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  rejected: "bg-destructive/10 text-destructive",
};

export function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-0 capitalize", STYLE[status])}>
      {status}
    </Badge>
  );
}
