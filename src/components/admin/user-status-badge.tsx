import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserStatus } from "@/types";

const STYLE: Record<UserStatus, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  suspended: "bg-destructive/10 text-destructive",
  deleted: "bg-muted text-muted-foreground",
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-0 capitalize", STYLE[status])}>
      {status}
    </Badge>
  );
}
