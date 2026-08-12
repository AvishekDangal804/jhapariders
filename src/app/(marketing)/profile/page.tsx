import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/shared/page-hero";
import { Container } from "@/components/shared/container";
import { ReferralCard } from "@/components/referrals/referral-card";
import { createClient } from "@/lib/supabase/server";
import { getMyReferralCode, getMyReferralHistory, getMyReferralRewardsTotal } from "@/lib/referrals/queries";
import { ProfileForm } from "./profile-form";
import type { UserRole } from "@/types";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/profile");

  // Best-effort: `profiles` doesn't exist until the Phase 3 migration runs,
  // so fall back to auth user_metadata (set at sign-up) until then.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, address, role, created_at")
    .eq("id", user.id)
    .maybeSingle<{
      full_name: string;
      phone: string;
      address: string | null;
      role: UserRole;
      created_at: string;
    }>()
    .then(
      (res) => res,
      () => ({ data: null })
    );

  const metadata = user.user_metadata as { full_name?: string; phone?: string; role?: UserRole };

  const initial = {
    fullName: profile?.full_name ?? metadata.full_name ?? "",
    phone: profile?.phone ?? metadata.phone ?? "",
    address: profile?.address ?? "",
    email: user.email ?? "",
    role: profile?.role ?? metadata.role ?? "passenger",
    createdAt: profile?.created_at ?? user.created_at,
  };

  const [referralCode, referralHistory, rewardsTotal] = await Promise.all([
    getMyReferralCode(),
    getMyReferralHistory(user.id),
    getMyReferralRewardsTotal(user.id),
  ]);

  return (
    <>
      <PageHero eyebrow="Account" title="Your profile" description="Manage your personal details." />
      <Container className="max-w-xl space-y-6 py-16">
        <ProfileForm userId={user.id} initial={initial} />
        <ReferralCard code={referralCode} history={referralHistory} rewardsTotal={rewardsTotal} />
      </Container>
    </>
  );
}
