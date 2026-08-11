import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { WalletTransactionType } from "@/types";

export interface WalletSummary {
  id: string;
  balance: number;
}

export interface WalletTransactionRow {
  id: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

export async function getWallet(
  ownerType: "passenger" | "rider",
  ownerId: string
): Promise<WalletSummary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wallets")
    .select("id, balance")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .maybeSingle<{ id: string; balance: number }>();

  return data;
}

export async function getWalletTransactions(walletId: string, limit = 20): Promise<WalletTransactionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wallet_transactions")
    .select("id, type, amount, balance_after, description, created_at")
    .eq("wallet_id", walletId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<
      { id: string; type: WalletTransactionType; amount: number; balance_after: number; description: string | null; created_at: string }[]
    >();

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    amount: row.amount,
    balanceAfter: row.balance_after,
    description: row.description,
    createdAt: row.created_at,
  }));
}
