import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/auth/role-home";
import type { UserRole } from "@/types";
import type { CurrentUser } from "@/lib/supabase/get-current-user";

// Authoritative profile fetch for dashboard layouts (backed by the real
// `profiles` table, unlike the auth-metadata fallback in
// get-current-user.ts). proxy.ts already redirects role mismatches at the
// edge — this is the defense-in-depth check for direct server rendering.
// Deduped with React's per-request cache so a layout + page that both call
// this for the same role only hit the database once.
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
    .select("id, role, full_name, email")
    .eq("id", user.id)
    .maybeSingle<{ id: string; role: UserRole; full_name: string; email: string }>();

  if (!profile) redirect("/login");
  if (profile.role !== requiredRole) redirect(roleHome[profile.role]);

  return {
    id: profile.id,
    role: profile.role,
    fullName: profile.full_name,
    email: profile.email,
  };
});
