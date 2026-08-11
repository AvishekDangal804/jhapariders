import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Component / Server Action / Route Handler client — reads and
// writes the session via the request's cookies. `setAll` is wrapped in a
// try/catch because Server Components can't set cookies; when this client
// is used there, the middleware (see middleware.ts) is what actually
// refreshes and persists the session cookie.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore, middleware
            // handles session refresh on the next request.
          }
        },
      },
    }
  );
}
