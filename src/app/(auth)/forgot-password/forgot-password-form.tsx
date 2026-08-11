"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/shared/auth-card";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/auth/schemas";

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordValues) {
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo:
        typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthCard title="Check your email">
        <div className="flex flex-col items-center py-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-6" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            If an account exists for that email, we sent a link to reset your password.
          </p>
          <Button variant="outline" className="mt-6 w-full" asChild>
            <Link href="/login">Back to Login</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send you a reset link."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to Login
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" className="mt-1.5" autoComplete="email" {...register("email")} />
          {errors.email ? <p className="mt-1 text-xs text-destructive">{errors.email.message}</p> : null}
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Send Reset Link
        </Button>
      </form>
    </AuthCard>
  );
}
