import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

// Reads the session user for layout/navbar purposes. Role comes from the
// auth user's metadata (set at sign-up) rather than the `profiles` table so
// this works before Phase 3's database migration exists; once that table
// and its `handle_new_user` trigger are in place, `profiles.role` becomes
// the authoritative source and this can be simplified to a single query.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const metadata = user.user_metadata as { full_name?: string; role?: UserRole };

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: metadata.full_name ?? user.email ?? "User",
    role: metadata.role ?? "passenger",
  };
}
