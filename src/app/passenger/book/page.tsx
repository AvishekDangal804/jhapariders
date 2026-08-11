import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/shared/container";
import { requireProfile } from "@/lib/supabase/require-profile";
import { BookingFlow } from "./booking-flow";

export const metadata: Metadata = { title: "Book a Ride" };

export default async function BookRidePage() {
  await requireProfile("passenger");

  return (
    <Container className="max-w-lg py-6 sm:py-8">
      <Suspense>
        <BookingFlow />
      </Suspense>
    </Container>
  );
}
