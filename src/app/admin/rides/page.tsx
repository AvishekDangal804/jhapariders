import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/shared/container";
import { AdminSearchInput } from "@/components/admin/search-input";
import { RideStatusBadge } from "@/components/rides/ride-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNpr } from "@/lib/fare";
import { getAdminRides } from "@/lib/admin/rides-queries";

export const metadata: Metadata = { title: "Rides" };

const filters = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default async function AdminRidesPage({ searchParams }: PageProps<"/admin/rides">) {
  const { page: pageParam, filter, search } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const activeFilter = typeof filter === "string" ? filter : "";
  const rideId = typeof search === "string" ? search : undefined;
  const { rides, totalPages } = await getAdminRides({ page, filter: activeFilter, rideId });

  return (
    <Container className="max-w-5xl py-6 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">Rides</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {filters.map((f) => (
            <Button key={f.value} variant={activeFilter === f.value ? "default" : "outline"} size="sm" asChild>
              <Link href={`/admin/rides${f.value ? `?filter=${f.value}` : ""}`}>{f.label}</Link>
            </Button>
          ))}
        </div>
        <Suspense>
          <AdminSearchInput placeholder="Search by ride ID..." />
        </Suspense>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ride ID</TableHead>
              <TableHead>Passenger</TableHead>
              <TableHead>Rider</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Fare</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No rides found.
                </TableCell>
              </TableRow>
            ) : (
              rides.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}</TableCell>
                  <TableCell>{r.passengerName ?? "—"}</TableCell>
                  <TableCell>{r.riderName ?? "—"}</TableCell>
                  <TableCell className="max-w-48 truncate text-muted-foreground">
                    {r.pickupAddress} → {r.destinationAddress}
                  </TableCell>
                  <TableCell className="capitalize">{r.serviceType}</TableCell>
                  <TableCell>{r.fare != null ? formatNpr(r.fare) : "—"}</TableCell>
                  <TableCell>
                    <RideStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
            {page > 1 ? <Link href={`/admin/rides?page=${page - 1}`}>Previous</Link> : <span>Previous</span>}
          </Button>
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
            {page < totalPages ? <Link href={`/admin/rides?page=${page + 1}`}>Next</Link> : <span>Next</span>}
          </Button>
        </div>
      ) : null}
    </Container>
  );
}
