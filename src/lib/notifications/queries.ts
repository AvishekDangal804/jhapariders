import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/types";

export interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(userId: string, limit = 30): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<
      { id: string; type: NotificationType; title: string; body: string | null; is_read: boolean; created_at: string }[]
    >();

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
}
