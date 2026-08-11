"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function FileUpload({
  label,
  bucket,
  pathPrefix,
  value,
  onChange,
}: {
  label: string;
  bucket: string;
  pathPrefix: string;
  value: string | null;
  onChange: (path: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, WEBP or PDF file.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("File must be smaller than 5MB.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${pathPrefix}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    setUploading(false);

    if (error) {
      toast.error("Upload failed. Please try again.");
      return;
    }
    setFileName(file.name);
    onChange(path);
  }

  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {value ? (
        <div className="mt-1.5 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm">
          <span className="flex items-center gap-2 truncate text-primary">
            <CheckCircle2 className="size-4 shrink-0" />
            {fileName ?? "Uploaded"}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setFileName(null);
            }}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Remove file"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className={cn("mt-1.5 w-full justify-start gap-2 font-normal text-muted-foreground")}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
          {uploading ? "Uploading..." : "Choose file (JPG, PNG or PDF, max 5MB)"}
        </Button>
      )}
    </div>
  );
}
