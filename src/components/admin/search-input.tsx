"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AdminSearchInput({ placeholder = "Search..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("search") ?? "");

  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value) params.set("search", value);
      else params.delete("search");
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        className="h-9 pl-8"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
