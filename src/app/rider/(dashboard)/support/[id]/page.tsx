import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/shared/container";
import { TicketThread } from "@/components/support/ticket-thread";
import { getTicketDetail } from "@/lib/support/queries";
import { requireRiderState } from "@/lib/supabase/require-rider";

export const metadata: Metadata = { title: "Support Ticket" };

export default async function RiderSupportTicketPage({ params }: PageProps<"/rider/support/[id]">) {
  const { id } = await params;
  const state = await requireRiderState();
  const ticket = await getTicketDetail(id);

  if (!ticket || ticket.userId !== state.user.id) notFound();

  return (
    <Container className="max-w-lg py-6 sm:py-8">
      <h1 className="text-lg font-semibold">Support</h1>
      <TicketThread ticket={ticket} currentUserId={state.user.id} isAdmin={false} />
    </Container>
  );
}
