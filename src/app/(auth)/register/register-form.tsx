"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/shared/auth-card";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterValues } from "@/lib/auth/schemas";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const roles: { value: Extract<UserRole, "passenger" | "rider">; label: string; description: string }[] = [
  { value: "passenger", label: "Passenger", description: "Book rides" },
  { value: "rider", label: "Rider", description: "Earn by driving" },
];

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "rider" ? "rider" : "passenger";
  const [submitting, setSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Extract<UserRole, "passenger" | "rider">>(initialRole);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: initialRole },
  });

  async function onSubmit(values: RegisterValues) {
    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          phone: values.phone,
          role: values.role,
        },
        emailRedirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
      },
    });

    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    // If email confirmation is required, `session` is null and the account
    // isn't usable yet — show a "check your email" state instead of
    // redirecting into a session that doesn't exist.
    if (!data.session) {
      setSubmittedEmail(values.email);
      return;
    }

    toast.success("Account created!");
    router.push(values.role === "rider" ? "/rider" : "/passenger");
    router.refresh();
  }

  if (submittedEmail) {
    return (
      <AuthCard title="Check your email">
        <div className="flex flex-col items-center py-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-6" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            We sent a confirmation link to <span className="font-medium text-foreground">{submittedEmail}</span>.
            Verify your email, then log in to continue.
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
      title="Create your account"
      description="Join JhapaRide as a passenger or a rider."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {roles.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => {
                setRole(r.value);
                setValue("role", r.value);
              }}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition-colors",
                role === r.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent"
              )}
              aria-pressed={role === r.value}
            >
              <span className="block text-sm font-semibold">{r.label}</span>
              <span className="block text-xs text-muted-foreground">{r.description}</span>
            </button>
          ))}
        </div>

        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" className="mt-1.5" autoComplete="name" {...register("fullName")} />
          {errors.fullName ? (
            <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" className="mt-1.5" autoComplete="email" {...register("email")} />
          {errors.email ? <p className="mt-1 text-xs text-destructive">{errors.email.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+977 98XXXXXXXX"
            className="mt-1.5"
            autoComplete="tel"
            {...register("phone")}
          />
          {errors.phone ? <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
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
          <Label htmlFor="confirmPassword">Confirm password</Label>
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
          Create Account
        </Button>
      </form>
    </AuthCard>
  );
}
