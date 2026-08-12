"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { TicketStatusBadge } from "./ticket-status-badge";
import type { SupportMessageRow, TicketDetail } from "@/lib/support/queries";
import type { SupportTicketStatus } from "@/types";

const STATUSES: SupportTicketStatus[] = ["open", "in_progress", "resolved", "closed"];

export function TicketThread({
  ticket,
  currentUserId,
  isAdmin,
}: {
  ticket: TicketDetail;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(ticket.messages);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(ticket.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function send() {
    if (!reply.trim()) return;
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("post_support_message", {
      p_ticket_id: ticket.id,
      p_message: reply,
    });
    setSending(false);

    if (error) {
      toast.error(error.message || "Could not send message.");
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        senderId: currentUserId,
        senderName: isAdmin ? "Support Team" : "You",
        isAdmin,
        message: reply,
        createdAt: new Date().toISOString(),
      } satisfies SupportMessageRow,
    ]);
    setReply("");
    router.refresh();
  }

  async function changeStatus(next: SupportTicketStatus) {
    setUpdatingStatus(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("update_support_ticket_status", {
      p_ticket_id: ticket.id,
      p_status: next,
    });
    setUpdatingStatus(false);

    if (error) {
      toast.error(error.message || "Could not update status.");
      return;
    }
    setStatus(next);
    toast.success("Ticket status updated.");
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
        <div>
          <p className="text-sm font-medium">{ticket.subject}</p>
          <p className="text-xs text-muted-foreground">
            Opened {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
        {isAdmin ? (
          <Select value={status} onValueChange={(v) => changeStatus(v as SupportTicketStatus)}>
            <SelectTrigger className="w-36" disabled={updatingStatus}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <TicketStatusBadge status={status} />
        )}
      </div>

      <div className="space-y-2.5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.senderId === currentUserId ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm",
                m.isAdmin
                  ? "bg-primary/10 text-foreground"
                  : m.senderId === currentUserId
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
              )}
            >
              <p className="mb-0.5 text-[11px] font-medium opacity-70">
                {m.isAdmin ? "Support Team" : (m.senderName ?? "User")}
              </p>
              <p className="whitespace-pre-wrap">{m.message}</p>
            </div>
          </div>
        ))}
      </div>

      {status !== "closed" ? (
        <div className="flex items-end gap-2">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply&hellip;"
            rows={2}
            className="flex-1"
          />
          <Button size="icon" aria-label="Send reply" onClick={send} disabled={sending || !reply.trim()}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">This ticket is closed.</p>
      )}
    </div>
  );
}
