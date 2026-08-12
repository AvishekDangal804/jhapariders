import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/auth/role-home";
import type { UserRole, UserStatus } from "@/types";
import type { CurrentUser } from "@/lib/supabase/get-current-user";

// Authoritative profile fetch for dashboard layouts (backed by the real
// `profiles` table, unlike the auth-metadata fallback in
// get-current-user.ts). proxy.ts already redirects role mismatches and
// suspended users at the edge, but that made it the *only* enforcement
// point — a suspended/deleted user reaching a server component any other
// way (a stale cached page, a direct fetch) would sail through. Checking
// status here too, not just role, closes that gap.
export const requireProfile = cache(async function requireProfile(
  requiredRole: UserRole
): Promise<CurrentUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${roleHome[requiredRole]}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, email, status")
    .eq("id", user.id)
    .maybeSingle<{ id: string; role: UserRole; full_name: string; email: string; status: UserStatus }>();

  if (!profile) redirect("/login");
  if (profile.status === "suspended" || profile.status === "deleted") {
    await supabase.auth.signOut();
    redirect("/login?suspended=1");
  }
  if (profile.role !== requiredRole) redirect(roleHome[profile.role]);

  return {
    id: profile.id,
    role: profile.role,
    fullName: profile.full_name,
    email: profile.email,
  };
});
