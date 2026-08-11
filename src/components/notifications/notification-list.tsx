"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@/lib/notifications/queries";

export function NotificationList({ initial }: { initial: NotificationRow[] }) {
  const [notifications, setNotifications] = useState(initial);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications"
        description="Updates about your rides and account will show up here."
        className="mt-4"
      />
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {notifications.map((n) => (
        <button
          key={n.id}
          onClick={() => !n.isRead && markRead(n.id)}
          className={cn(
            "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm",
            !n.isRead && "border-primary/30 bg-primary/5"
          )}
        >
          {!n.isRead ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" /> : null}
          <div className="min-w-0">
            <p className="font-medium">{n.title}</p>
            {n.body ? <p className="mt-0.5 text-muted-foreground">{n.body}</p> : null}
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(n.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
