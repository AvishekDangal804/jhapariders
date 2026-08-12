"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ensureRealtimeAuth } from "@/lib/supabase/ensure-realtime-auth";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@/lib/notifications/queries";

export function NotificationList({ userId, initial }: { userId: string; initial: NotificationRow[] }) {
  const [notifications, setNotifications] = useState(initial);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`notification-list:${userId}`);

    ensureRealtimeAuth(supabase).then(() => {
      channel
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          (payload) => {
            const row = payload.new as {
              id: string;
              type: NotificationRow["type"];
              title: string;
              body: string | null;
              is_read: boolean;
              created_at: string;
            };
            setNotifications((prev) => [
              {
                id: row.id,
                type: row.type,
                title: row.title,
                body: row.body,
                isRead: row.is_read,
                createdAt: row.created_at,
              },
              ...prev,
            ]);
          }
        )
        .subscribe();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    const supabase = createClient();
    await supabase.rpc("mark_all_notifications_read");
  }

  const hasUnread = notifications.some((n) => !n.isRead);

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
    <div className="mt-4 space-y-3">
      {hasUnread ? (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        </div>
      ) : null}
      <div className="space-y-2">
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
    </div>
  );
}