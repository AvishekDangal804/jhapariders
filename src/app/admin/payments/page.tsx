import type { Metadata } from "next";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
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
import { formatNpr } from "@/lib/fare";
import { getAdminPayments } from "@/lib/admin/payments-queries";
import type { PaymentStatus } from "@/types";

export const metadata: Metadata = { title: "Payments" };

const filters: { label: string; value: PaymentStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Success", value: "success" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
];

export default async function AdminPaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  const { page: pageParam, status } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const statusFilter = (typeof status === "string" ? status : "all") as PaymentStatus | "all";
  const { payments, totalPages } = await getAdminPayments({ page, status: statusFilter });

  return (
    <Container className="max-w-5xl py-6 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">Payments</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button key={f.value} variant={statusFilter === f.value ? "default" : "outline"} size="sm" asChild>
            <Link href={`/admin/payments${f.value === "all" ? "" : `?status=${f.value}`}`}>{f.label}</Link>
          </Button>
        ))}
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Payments will appear here once rides start completing."
          className="mt-8"
        />
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Ride</TableHead>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.rideId.slice(0, 8)}</TableCell>
                    <TableCell>{p.passengerName ?? "—"}</TableCell>
                    <TableCell>{formatNpr(p.amount)}</TableCell>
                    <TableCell>{formatNpr(p.commissionAmount)}</TableCell>
                    <TableCell className="capitalize">{p.method}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between text-sm">
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? <Link href={`/admin/payments?page=${page - 1}`}>Previous</Link> : <span>Previous</span>}
              </Button>
              <span className="text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
                {page < totalPages ? <Link href={`/admin/payments?page=${page + 1}`}>Next</Link> : <span>Next</span>}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </Container>
  );
}
