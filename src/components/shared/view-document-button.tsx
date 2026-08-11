"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function ViewDocumentButton({ bucket, path }: { bucket: string; path: string }) {
  const [loading, setLoading] = useState(false);

  async function handleView() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
    setLoading(false);

    if (error || !data) {
      toast.error("Couldn't open this document.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <Button variant="outline" size="sm" onClick={handleView} disabled={loading}>
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <ExternalLink className="size-3.5" />}
      View
    </Button>
  );
}
