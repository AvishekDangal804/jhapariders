import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { Container } from "@/components/shared/container";
import { VerificationStatusBadge } from "@/components/rides/verification-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRiders } from "@/lib/admin/riders-queries";
import type { VerificationStatus } from "@/types";

export const metadata: Metadata = { title: "Riders" };

export default async function AdminRidersPage({ searchParams }: PageProps<"/admin/riders">) {
  const { page: pageParam, status } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const statusFilter = (typeof status === "string" ? status : "all") as VerificationStatus | "all";
  const { riders, totalPages } = await getRiders({ page, status: statusFilter });

  const filters: { label: string; value: VerificationStatus | "all" }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <Container className="max-w-5xl py-6 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">Riders</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/admin/riders${f.value === "all" ? "" : `?status=${f.value}`}`}>{f.label}</Link>
          </Button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Online</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {riders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No riders found.
                </TableCell>
              </TableRow>
            ) : (
              riders.map((r) => (
                <TableRow key={r.riderProfileId}>
                  <TableCell className="font-medium">{r.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{r.phone}</TableCell>
                  <TableCell className="text-muted-foreground">{r.vehicleSummary ?? "—"}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      {r.ratingAvg.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <VerificationStatusBadge status={r.verificationStatus} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.isOnline ? "default" : "secondary"}>
                      {r.isOnline ? "Online" : "Offline"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/riders/${r.riderProfileId}`}>View</Link>
                    </Button>
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
            {page > 1 ? <Link href={`/admin/riders?page=${page - 1}`}>Previous</Link> : <span>Previous</span>}
          </Button>
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
            {page < totalPages ? <Link href={`/admin/riders?page=${page + 1}`}>Next</Link> : <span>Next</span>}
          </Button>
        </div>
      ) : null}
    </Container>
  );
}
