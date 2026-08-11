import { createBrowserClient } from "@supabase/ssr";

// TODO(Phase 3): pass the generated `Database` type (from
// `supabase gen types typescript`) as a generic here once the schema exists.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
