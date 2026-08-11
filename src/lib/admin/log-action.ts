import { createClient } from "@/lib/supabase/client";

// Every admin mutation (approve/reject/suspend/pricing change/etc.) should
// call this so /admin/audit-logs has a real trail — RLS already scopes
// admin_logs inserts to admin-only.
export async function logAdminAction(
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("admin_logs").insert({
    admin_id: user.id,
    action,
    target_type: targetType ?? null,
    target_id: targetId ?? null,
    metadata: metadata ?? null,
  });
}
