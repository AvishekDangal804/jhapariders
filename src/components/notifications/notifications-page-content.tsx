import { Container } from "@/components/shared/container";
import { getNotifications } from "@/lib/notifications/queries";
import { NotificationList } from "./notification-list";

export async function NotificationsPageContent({ userId }: { userId: string }) {
  const notifications = await getNotifications(userId);

  return (
    <Container className="max-w-lg py-6 sm:py-8">
      <h1 className="text-lg font-semibold">Notifications</h1>
      <NotificationList userId={userId} initial={notifications} />
    </Container>
  );
}
