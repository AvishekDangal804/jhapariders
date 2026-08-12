import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SupportCategory, SupportTicketStatus } from "@/types";

export interface SupportTicketRow {
  id: string;
  category: SupportCategory;
  subject: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
}

interface RawTicketRow {
  id: string;
  category: SupportCategory;
  subject: string;
  status: SupportTicketStatus;
  created_at: string;
  updated_at: string;
  user: { full_name: string } | { full_name: string }[] | null;
}

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getMyTickets(userId: string): Promise<SupportTicketRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_tickets")
    .select("id, category, subject, status, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .returns<Omit<RawTicketRow, "user">[]>();

  return (data ?? []).map((row) => ({
    id: row.id,
    category: row.category,
    subject: row.subject,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userName: null,
  }));
}

export async function getAllTickets(): Promise<SupportTicketRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_tickets")
    .select("id, category, subject, status, created_at, updated_at, user:profiles!support_tickets_user_id_fkey(full_name)")
    .order("updated_at", { ascending: false })
    .limit(200)
    .returns<RawTicketRow[]>();

  return (data ?? []).map((row) => ({
    id: row.id,
    category: row.category,
    subject: row.subject,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userName: one(row.user)?.full_name ?? null,
  }));
}

export interface SupportMessageRow {
  id: string;
  senderId: string;
  senderName: string | null;
  isAdmin: boolean;
  message: string;
  createdAt: string;
}

export interface TicketDetail {
  id: string;
  userId: string;
  category: SupportCategory;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  createdAt: string;
  messages: SupportMessageRow[];
}

interface RawMessageRow {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender: { full_name: string; role: string } | { full_name: string; role: string }[] | null;
}

export async function getTicketDetail(ticketId: string): Promise<TicketDetail | null> {
  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, user_id, category, subject, description, status, created_at")
    .eq("id", ticketId)
    .maybeSingle<{
      id: string;
      user_id: string;
      category: SupportCategory;
      subject: string;
      description: string;
      status: SupportTicketStatus;
      created_at: string;
    }>();

  if (!ticket) return null;

  const { data: messages } = await supabase
    .from("support_messages")
    .select("id, sender_id, message, created_at, sender:profiles!support_messages_sender_id_fkey(full_name, role)")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true })
    .returns<RawMessageRow[]>();

  return {
    id: ticket.id,
    userId: ticket.user_id,
    category: ticket.category,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status,
    createdAt: ticket.created_at,
    messages: (messages ?? []).map((m) => {
      const sender = one(m.sender);
      return {
        id: m.id,
        senderId: m.sender_id,
        senderName: sender?.full_name ?? null,
        isAdmin: sender?.role === "admin",
        message: m.message,
        createdAt: m.created_at,
      };
    }),
  };
}
