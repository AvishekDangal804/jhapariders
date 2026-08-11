import type { Metadata } from "next";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { RideCard } from "@/components/rides/ride-card";
import { Button } from "@/components/ui/button";
import { requireRiderState } from "@/lib/supabase/require-rider";
import { getRideHistoryForRider } from "@/lib/rides/queries";

export const metadata: Metadata = { title: "Ride History" };

export default async function RiderHistoryPage({ searchParams }: PageProps<"/rider/history">) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const state = await requireRiderState();
  const { rides, totalPages } = await getRideHistoryForRider(state.user.id, page);

  return (
    <Container className="max-w-lg py-6 sm:py-8">
      <h1 className="text-lg font-semibold">Ride History</h1>

      {rides.length === 0 ? (
        <EmptyState
          icon={Clock3}
          title="No rides yet"
          description="Completed and cancelled rides will show up here."
          className="mt-4"
        />
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {rides.map((ride) => (
              <RideCard key={ride.id} ride={ride} href={`/rider/ride/${ride.id}`} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between text-sm">
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? <Link href={`/rider/history?page=${page - 1}`}>Previous</Link> : <span>Previous</span>}
              </Button>
              <span className="text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
                {page < totalPages ? <Link href={`/rider/history?page=${page + 1}`}>Next</Link> : <span>Next</span>}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </Container>
  );
}
