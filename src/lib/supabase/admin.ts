import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Privileged client using the service_role/secret key — bypasses Row Level
// Security entirely. The `server-only` import makes any accidental client
// bundle reference fail at build time.
//
// Only ever use this for operations that genuinely require bypassing RLS
// (e.g. admin verification actions, server-computed fare/commission writes,
// signed document URLs). Never forward this client or its key to the
// browser, and never use it as a shortcut around writing a proper RLS
// policy for a user-facing read/write.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
