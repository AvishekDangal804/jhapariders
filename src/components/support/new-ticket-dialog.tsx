"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { SupportCategory } from "@/types";

const CATEGORIES: { value: SupportCategory; label: string }[] = [
  { value: "ride_problem", label: "Ride problem" },
  { value: "payment_problem", label: "Payment problem" },
  { value: "rider_problem", label: "Rider problem" },
  { value: "passenger_problem", label: "Passenger problem" },
  { value: "account_problem", label: "Account problem" },
  { value: "safety_issue", label: "Safety issue" },
];

export function NewTicketDialog({ basePath }: { basePath: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<SupportCategory>("ride_problem");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in a subject and description.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_support_ticket", {
      p_category: category,
      p_subject: subject,
      p_description: description,
    });
    setLoading(false);

    if (error || !data) {
      toast.error(error?.message || "Could not create ticket.");
      return;
    }
    toast.success("Support ticket created.");
    setOpen(false);
    setSubject("");
    setDescription("");
    router.push(`${basePath}/${data as string}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          New Ticket
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact support</DialogTitle>
          <DialogDescription>Tell us what&apos;s going on and our team will get back to you.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as SupportCategory)}>
              <SelectTrigger id="category" className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" className="mt-1.5" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              className="mt-1.5"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
