import type { SupabaseClient } from "@supabase/supabase-js";

// On a fresh page load, the browser client restores its session from
// cookies, but the Realtime websocket connection doesn't automatically
// carry that token — subscribing before this resolves connects as
// anonymous, so RLS silently drops every event with no error. Call this
// before `.channel(...).subscribe()` on any RLS-scoped realtime channel.
export async function ensureRealtimeAuth(supabase: SupabaseClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    await supabase.realtime.setAuth(session.access_token);
  }
}