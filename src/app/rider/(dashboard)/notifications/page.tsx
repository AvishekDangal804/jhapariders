import type { Metadata } from "next";
import { NotificationsPageContent } from "@/components/notifications/notifications-page-content";
import { requireRiderState } from "@/lib/supabase/require-rider";

export const metadata: Metadata = { title: "Notifications" };

export default async function RiderNotificationsPage() {
  const state = await requireRiderState();
  return <NotificationsPageContent userId={state.user.id} />;
}
