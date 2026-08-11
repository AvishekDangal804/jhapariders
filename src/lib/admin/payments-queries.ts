import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod, PaymentStatus } from "@/types";

export interface AdminPaymentRow {
  id: string;
  rideId: string;
  passengerName: string | null;
  amount: number;
  commissionAmount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
}

interface PaymentRow {
  id: string;
  ride_id: string;
  amount: number;
  commission_amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  created_at: string;
  passenger: { full_name: string } | { full_name: string }[] | null;
}

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

const PAGE_SIZE = 15;

export async function getAdminPayments({
  page,
  status,
}: {
  page: number;
  status?: PaymentStatus | "all";
}): Promise<{ payments: AdminPaymentRow[]; totalPages: number }> {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("payments")
    .select(
      "id, ride_id, amount, commission_amount, method, status, created_at, passenger:profiles!payments_passenger_id_fkey(full_name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, count } = await query.range(from, to).returns<PaymentRow[]>();

  return {
    payments: (data ?? []).map((row) => ({
      id: row.id,
      rideId: row.ride_id,
      passengerName: one(row.passenger)?.full_name ?? null,
      amount: row.amount,
      commissionAmount: row.commission_amount,
      method: row.method,
      status: row.status,
      createdAt: row.created_at,
    })),
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}
