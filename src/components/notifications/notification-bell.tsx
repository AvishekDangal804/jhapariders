"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ensureRealtimeAuth } from "@/lib/supabase/ensure-realtime-auth";

export function NotificationBell({
  userId,
  href,
  initialUnreadCount,
}: {
  userId: string;
  href: string;
  initialUnreadCount: number;
}) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`notification-bell:${userId}`);

    ensureRealtimeAuth(supabase).then(() => {
      channel
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          () => setUnreadCount((count) => count + 1)
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          (payload) => {
            const isRead = (payload.new as { is_read: boolean }).is_read;
            const wasRead = (payload.old as { is_read: boolean }).is_read;
            if (isRead && !wasRead) setUnreadCount((count) => Math.max(0, count - 1));
          }
        )
        .subscribe();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Link
      href={href}
      className="relative hidden rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground sm:flex"
      aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
    >
      <Bell className="size-5" />
      {unreadCount > 0 ? (
        <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold text-destructive-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}