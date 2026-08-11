"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/shared/auth-card";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/auth/schemas";

export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // The recovery link's tokens are exchanged for a session client-side
    // when the page loads. PASSWORD_RECOVERY fires once that's done; we
    // also check for an existing session in case it resolved before this
    // listener attached.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordValues) {
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (done) {
    return (
      <AuthCard title="Password updated">
        <div className="flex flex-col items-center py-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-6" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Your password has been updated. Redirecting you to login&hellip;
          </p>
        </div>
      </AuthCard>
    );
  }

  if (!ready) {
    return (
      <AuthCard title="Reset link required">
        <p className="text-sm text-muted-foreground">
          This page only works when opened from a password reset email. Request a new link if
          yours has expired.
        </p>
        <Button variant="outline" className="mt-6 w-full" asChild>
          <Link href="/forgot-password">Request Reset Link</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            className="mt-1.5"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            className="mt-1.5"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>
          ) : null}
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Update Password
        </Button>
      </form>
    </AuthCard>
  );
}
