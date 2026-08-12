import type { Metadata } from "next";
import { NotificationsPageContent } from "@/components/notifications/notifications-page-content";
import { requireProfile } from "@/lib/supabase/require-profile";

export const metadata: Metadata = { title: "Notifications" };

export default async function AdminNotificationsPage() {
  const user = await requireProfile("admin");
  return <NotificationsPageContent userId={user.id} />;
}
