import type { Metadata } from "next";
import { Landmark } from "lucide-react";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNpr } from "@/lib/fare";
import { createClient } from "@/lib/supabase/server";
import type { WithdrawalStatus } from "@/types";
import { WithdrawalActions } from "./withdrawal-actions";

export const metadata: Metadata = { title: "Withdrawals" };

interface WithdrawalRow {
  id: string;
  amount: number;
  payment_method: string;
  account_reference: string;
  status: WithdrawalStatus;
  requested_at: string;
  rider: { full_name: string } | { full_name: string }[] | null;
}

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function AdminWithdrawalsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("withdrawals")
    .select(
      "id, amount, payment_method, account_reference, status, requested_at, rider:profiles!withdrawals_rider_id_fkey(full_name)"
    )
    .order("requested_at", { ascending: false })
    .returns<WithdrawalRow[]>();

  const withdrawals = data ?? [];

  return (
    <Container className="max-w-4xl py-6 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">Withdrawals</h1>

      {withdrawals.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No withdrawal requests"
          description="Rider payout requests will show up here."
          className="mt-8"
        />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rider</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{one(w.rider)?.full_name ?? "—"}</TableCell>
                  <TableCell>{formatNpr(w.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{w.payment_method}</TableCell>
                  <TableCell className="text-muted-foreground">{w.account_reference}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {w.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(w.requested_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </TableCell>
                  <TableCell className="text-right">
                    {w.status === "pending" ? <WithdrawalActions withdrawalId={w.id} /> : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Container>
  );
}
