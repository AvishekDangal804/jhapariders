import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { NewTicketDialog } from "@/components/support/new-ticket-dialog";
import { TicketList } from "@/components/support/ticket-list";
import { getMyTickets } from "@/lib/support/queries";
import { requireProfile } from "@/lib/supabase/require-profile";

export const metadata: Metadata = { title: "Support" };

export default async function PassengerSupportPage() {
  const user = await requireProfile("passenger");
  const tickets = await getMyTickets(user.id);

  return (
    <Container className="max-w-lg py-6 sm:py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Support</h1>
        <NewTicketDialog basePath="/passenger/support" />
      </div>
      <TicketList tickets={tickets} basePath="/passenger/support" />
    </Container>
  );
}
