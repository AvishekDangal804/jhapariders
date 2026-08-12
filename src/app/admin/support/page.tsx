import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { TicketList } from "@/components/support/ticket-list";
import { getAllTickets } from "@/lib/support/queries";
import { requireProfile } from "@/lib/supabase/require-profile";

export const metadata: Metadata = { title: "Support Tickets" };

export default async function AdminSupportPage() {
  await requireProfile("admin");
  const tickets = await getAllTickets();

  return (
    <Container className="max-w-4xl py-6 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">Support Tickets</h1>
      <TicketList tickets={tickets} basePath="/admin/support" showRequester />
    </Container>
  );
}
