"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { profileUpdateSchema, type ProfileUpdateValues } from "@/lib/profile/schema";
import type { UserRole } from "@/types";

interface ProfileFormProps {
  userId: string;
  initial: {
    fullName: string;
    phone: string;
    address: string;
    email: string;
    role: UserRole;
    createdAt: string;
  };
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

export function ProfileForm({ userId, initial }: ProfileFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileUpdateValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: initial.fullName,
      phone: initial.phone,
      address: initial.address,
    },
  });

  async function onSubmit(values: ProfileUpdateValues) {
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: values.fullName, phone: values.phone, address: values.address || null })
      .eq("id", userId);
    setSubmitting(false);

    if (error) {
      toast.error("Couldn't save your profile. Please try again.");
      return;
    }
    toast.success("Profile updated");
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary/10 text-lg text-primary">
              {initials(initial.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{initial.fullName || "Your name"}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {initial.role}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Joined {new Date(initial.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={initial.email} disabled className="mt-1.5" />
            <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" className="mt-1.5" {...register("fullName")} />
            {errors.fullName ? (
              <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" className="mt-1.5" {...register("phone")} />
            {errors.phone ? <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p> : null}
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" className="mt-1.5" {...register("address")} />
            {errors.address ? (
              <p className="mt-1 text-xs text-destructive">{errors.address.message}</p>
            ) : null}
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
