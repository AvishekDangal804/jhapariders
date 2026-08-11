"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { logAdminAction } from "@/lib/admin/log-action";
import type { UserStatus } from "@/types";

export function SuspendUserButton({ userId, status }: { userId: string; status: UserStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const suspended = status === "suspended";

  async function toggle() {
    setLoading(true);
    const supabase = createClient();
    const nextStatus: UserStatus = suspended ? "active" : "suspended";
    const { error } = await supabase.from("profiles").update({ status: nextStatus }).eq("id", userId);
    setLoading(false);

    if (error) {
      toast.error("Couldn't update this user.");
      return;
    }
    await logAdminAction(suspended ? "Restored user" : "Suspended user", "profiles", userId);
    toast.success(suspended ? "User restored" : "User suspended");
    router.refresh();
  }

  return (
    <Button
      size="sm"
      variant={suspended ? "outline" : "destructive"}
      onClick={toggle}
      disabled={loading}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
      {suspended ? "Restore" : "Suspend"}
    </Button>
  );
}
