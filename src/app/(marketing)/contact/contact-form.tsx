"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const contactSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  message: z.string().min(10, "Message should be at least 10 characters"),
});

type ContactValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) });

  async function onSubmit() {
    setSubmitting(true);
    // Demo mode: no backend is wired up yet for the marketing contact form
    // (support tickets are handled inside the authenticated app from Phase
    // 10 onward). Simulate a submission so the UI/UX can be fully evaluated.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSubmitting(false);
    toast.success("Message sent (demo mode) — we'll get back to you soon.");
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" className="mt-1.5" {...register("name")} />
        {errors.name ? <p className="mt-1 text-xs text-destructive">{errors.name.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" className="mt-1.5" {...register("email")} />
        {errors.email ? <p className="mt-1 text-xs text-destructive">{errors.email.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" rows={5} className="mt-1.5" {...register("message")} />
        {errors.message ? (
          <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Send Message
      </Button>
    </form>
  );
}
