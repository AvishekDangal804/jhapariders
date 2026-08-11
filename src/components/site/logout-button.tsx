"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

export function LogoutMenuItem() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenuItem onClick={handleLogout} disabled={loading} variant="destructive">
      <LogOut className="size-4" />
      Log out
    </DropdownMenuItem>
  );
}
