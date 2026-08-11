"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/shared/auth-card";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginValues } from "@/lib/auth/schemas";
import { roleHome } from "@/lib/auth/role-home";
import type { UserRole } from "@/types";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (searchParams.get("suspended")) {
      toast.error("Your account has been suspended. Contact support for help.");
    }
  }, [searchParams]);

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }

    // Best-effort role/status lookup — falls back to `next` or home if the
    // `profiles` table isn't set up yet (Phase 3).
    let destination = searchParams.get("next") ?? "/";
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", data.user.id)
        .maybeSingle<{ role: UserRole; status: string }>();

      if (profile?.status === "suspended") {
        await supabase.auth.signOut();
        setSubmitting(false);
        toast.error("Your account has been suspended. Contact support for help.");
        return;
      }
      if (profile?.role && !searchParams.get("next")) destination = roleHome[profile.role];
    }

    toast.success("Welcome back!");
    router.push(destination);
    router.refresh();
  }

  return (
    <AuthCard
      title="Welcome back"
      description="Log in to book a ride or manage your rider account."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Register
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" className="mt-1.5" autoComplete="email" {...register("email")} />
          {errors.email ? <p className="mt-1 text-xs text-destructive">{errors.email.message}</p> : null}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            className="mt-1.5"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Log In
        </Button>
      </form>
    </AuthCard>
  );
}
