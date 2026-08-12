"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { logAdminAction } from "@/lib/admin/log-action";

export function CouponToggleButton({ id, code, isActive }: { id: string; code: string; isActive: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("coupons").update({ is_active: !isActive }).eq("id", id);
    setLoading(false);

    if (error) {
      toast.error("Couldn't update coupon.");
      return;
    }
    await logAdminAction(`${isActive ? "Deactivated" : "Activated"} coupon ${code}`, "coupons", id);
    toast.success(isActive ? "Coupon deactivated" : "Coupon activated");
    router.refresh();
  }

  return (
    <Button size="sm" variant={isActive ? "outline" : "secondary"} onClick={toggle} disabled={loading}>
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
      {isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
