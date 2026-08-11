import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/shared/container";
import { AdminSearchInput } from "@/components/admin/search-input";
import { UserStatusBadge } from "@/components/admin/user-status-badge";
import { SuspendUserButton } from "@/components/admin/suspend-user-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getUsers } from "@/lib/admin/users-queries";
import type { UserRole } from "@/types";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const { page: pageParam, search, role } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { users, totalPages } = await getUsers({
    page,
    search: typeof search === "string" ? search : undefined,
    role: (typeof role === "string" ? role : "all") as UserRole | "all",
  });

  return (
    <Container className="max-w-5xl py-6 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">Users</h1>

      <div className="mt-4">
        <Suspense>
          <AdminSearchInput placeholder="Search by name or email..." />
        </Suspense>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-muted-foreground">{u.phone}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <UserStatusBadge status={u.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </TableCell>
                  <TableCell className="text-right">
                    <SuspendUserButton userId={u.id} status={u.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
            {page > 1 ? <Link href={`/admin/users?page=${page - 1}`}>Previous</Link> : <span>Previous</span>}
          </Button>
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
            {page < totalPages ? <Link href={`/admin/users?page=${page + 1}`}>Next</Link> : <span>Next</span>}
          </Button>
        </div>
      ) : null}
    </Container>
  );
}
