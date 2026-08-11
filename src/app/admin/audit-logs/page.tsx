import type { Metadata } from "next";
import { FileClock } from "lucide-react";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Audit Logs" };

interface LogRow {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
  admin: { full_name: string } | { full_name: string }[] | null;
}

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function AdminAuditLogsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("admin_logs")
    .select("id, action, target_type, target_id, created_at, admin:profiles!admin_logs_admin_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<LogRow[]>();

  const logs = data ?? [];

  return (
    <Container className="max-w-4xl py-6 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">Audit Logs</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        A record of every administrative action taken on the platform.
      </p>

      {logs.length === 0 ? (
        <EmptyState
          icon={FileClock}
          title="No activity yet"
          description="Admin actions like approvals and pricing changes will be logged here."
          className="mt-8"
        />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{one(log.admin)?.full_name ?? "—"}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.target_type ? `${log.target_type}${log.target_id ? ` · ${log.target_id.slice(0, 8)}` : ""}` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Container>
  );
}
