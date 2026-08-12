import type { Metadata } from "next";
import { Ticket } from "lucide-react";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CouponToggleButton } from "@/components/coupons/coupon-toggle-button";
import { NewCouponDialog } from "@/components/coupons/new-coupon-dialog";
import { formatNpr } from "@/lib/fare";
import { getCoupons } from "@/lib/coupons/queries";
import { requireProfile } from "@/lib/supabase/require-profile";

export const metadata: Metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  await requireProfile("admin");
  const coupons = await getCoupons();

  return (
    <Container className="max-w-4xl py-6 sm:py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Coupons</h1>
        <NewCouponDialog />
      </div>

      {coupons.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No coupons yet"
          description="Create a promo code to offer passengers a discount at booking."
          className="mt-8"
        />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min. fare</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.code}</TableCell>
                  <TableCell>
                    {c.discountType === "flat" ? formatNpr(c.discountValue) : `${c.discountValue}%`}
                    {c.discountType === "percentage" && c.maximumDiscount ? (
                      <span className="text-muted-foreground"> (up to {formatNpr(c.maximumDiscount)})</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatNpr(c.minimumFare)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.usageCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.expiryDate
                      ? new Date(c.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "No expiry"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.isActive ? "default" : "outline"}>{c.isActive ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <CouponToggleButton id={c.id} code={c.code} isActive={c.isActive} />
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
