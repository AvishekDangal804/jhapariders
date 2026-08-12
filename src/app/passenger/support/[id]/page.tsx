import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/shared/container";
import { TicketThread } from "@/components/support/ticket-thread";
import { getTicketDetail } from "@/lib/support/queries";
import { requireProfile } from "@/lib/supabase/require-profile";

export const metadata: Metadata = { title: "Support Ticket" };

export default async function PassengerSupportTicketPage({ params }: PageProps<"/passenger/support/[id]">) {
  const { id } = await params;
  const user = await requireProfile("passenger");
  const ticket = await getTicketDetail(id);

  if (!ticket || ticket.userId !== user.id) notFound();

  return (
    <Container className="max-w-lg py-6 sm:py-8">
      <h1 className="text-lg font-semibold">Support</h1>
      <TicketThread ticket={ticket} currentUserId={user.id} isAdmin={false} />
    </Container>
  );
}
