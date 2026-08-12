import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Referral } from "@/types";

export async function getMyReferralCode(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_referral_code");
  if (error) return null;
  return (data as string) ?? null;
}

interface ReferralRow {
  id: string;
  referrer_id: string;
  code: string;
  referred_user_id: string | null;
  referred_role: Referral["referredRole"];
  status: Referral["status"];
  created_at: string;
  completed_at: string | null;
  referred_user: { full_name: string } | { full_name: string }[] | null;
}

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getMyReferralHistory(userId: string): Promise<Referral[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("referrals")
    .select(
      "id, referrer_id, code, referred_user_id, referred_role, status, created_at, completed_at, referred_user:profiles!referrals_referred_user_id_fkey(full_name)"
    )
    .eq("referrer_id", userId)
    .not("referred_user_id", "is", null)
    .order("created_at", { ascending: false })
    .returns<ReferralRow[]>();

  return (data ?? []).map((row) => ({
    id: row.id,
    referrerId: row.referrer_id,
    code: row.code,
    referredUserId: row.referred_user_id,
    referredUserName: one(row.referred_user)?.full_name ?? null,
    referredRole: row.referred_role,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }));
}

export async function getMyReferralRewardsTotal(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from("referral_rewards").select("amount").eq("user_id", userId).returns<{ amount: number }[]>();
  return (data ?? []).reduce((sum, r) => sum + r.amount, 0);
}
