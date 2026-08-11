import type { Metadata } from "next";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { RideCard } from "@/components/rides/ride-card";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/supabase/require-profile";
import { getRideHistory } from "@/lib/rides/queries";

export const metadata: Metadata = { title: "Ride History" };

export default async function RideHistoryPage({
  searchParams,
}: PageProps<"/passenger/history">) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const user = await requireProfile("passenger");
  const { rides, totalPages } = await getRideHistory(user.id, page);

  return (
    <Container className="max-w-lg py-6 sm:py-8">
      <h1 className="text-lg font-semibold">Ride History</h1>

      {rides.length === 0 ? (
        <EmptyState
          icon={Clock3}
          title="No rides yet"
          description="Rides you book will show up here."
          className="mt-4"
          action={
            <Button asChild size="sm">
              <Link href="/passenger/book">Book a Ride</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {rides.map((ride) => (
              <RideCard key={ride.id} ride={ride} href={`/passenger/ride/${ride.id}`} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between text-sm">
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? (
                  <Link href={`/passenger/history?page=${page - 1}`}>Previous</Link>
                ) : (
                  <span>Previous</span>
                )}
              </Button>
              <span className="text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
                {page < totalPages ? (
                  <Link href={`/passenger/history?page=${page + 1}`}>Next</Link>
                ) : (
                  <span>Next</span>
                )}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </Container>
  );
}
