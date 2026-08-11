import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UserRole, UserStatus } from "@/types";

export interface AdminUserRow {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

const PAGE_SIZE = 15;

export async function getUsers({
  page,
  search,
  role,
}: {
  page: number;
  search?: string;
  role?: UserRole | "all";
}): Promise<{ users: AdminUserRow[]; totalPages: number }> {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (role && role !== "all") {
    query = query.eq("role", role);
  }

  const { data, count } = await query
    .range(from, to)
    .returns<
      { id: string; full_name: string; email: string; phone: string; role: UserRole; status: UserStatus; created_at: string }[]
    >();

  return {
    users: (data ?? []).map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
    })),
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}
