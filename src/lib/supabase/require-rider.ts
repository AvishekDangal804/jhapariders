import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/require-profile";
import type { VerificationStatus } from "@/types";
import type { CurrentUser } from "@/lib/supabase/get-current-user";

export interface RiderState {
  user: CurrentUser;
  riderProfileId: string;
  verificationStatus: VerificationStatus;
  isOnline: boolean;
  hasCompletedOnboarding: boolean;
  vehicleCount: number;
}

// A rider's `rider_profiles` row is created automatically at signup, but
// starts empty (no license, no vehicle) — "onboarding complete" here means
// they've actually submitted the wizard, tracked via license_number being
// set, independent of whether admin has approved them yet.
export const requireRiderState = cache(async function requireRiderState(): Promise<RiderState> {
  const user = await requireProfile("rider");
  const supabase = await createClient();

  const { data: riderProfile } = await supabase
    .from("rider_profiles")
    .select("id, verification_status, license_number, is_online")
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      verification_status: VerificationStatus;
      license_number: string | null;
      is_online: boolean;
    }>();

  if (!riderProfile) redirect("/login");

  const { count } = await supabase
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .eq("rider_id", riderProfile.id);

  return {
    user,
    riderProfileId: riderProfile.id,
    verificationStatus: riderProfile.verification_status,
    isOnline: riderProfile.is_online,
    hasCompletedOnboarding: Boolean(riderProfile.license_number) && (count ?? 0) > 0,
    vehicleCount: count ?? 0,
  };
});
