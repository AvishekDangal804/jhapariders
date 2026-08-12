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
import { createClient } from "@/lib/supabase/client";
import { logAdminAction } from "@/lib/admin/log-action";
import type { CouponDiscountType } from "@/types";

export function NewCouponDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<CouponDiscountType>("flat");
  const [discountValue, setDiscountValue] = useState("");
  const [minimumFare, setMinimumFare] = useState("0");
  const [maximumDiscount, setMaximumDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setCode("");
    setDiscountType("flat");
    setDiscountValue("");
    setMinimumFare("0");
    setMaximumDiscount("");
    setUsageLimit("");
    setExpiryDate("");
  }

  async function save() {
    if (!code.trim() || !discountValue) {
      toast.error("Enter a code and discount value.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("coupons").insert({
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      minimum_fare: Number(minimumFare) || 0,
      maximum_discount: maximumDiscount ? Number(maximumDiscount) : null,
      usage_limit: usageLimit ? Number(usageLimit) : null,
      expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
      created_by: user?.id ?? null,
    });
    setSaving(false);

    if (error) {
      toast.error(error.message.includes("duplicate") ? "That code already exists." : "Couldn't create coupon.");
      return;
    }
    await logAdminAction(`Created coupon ${code.trim().toUpperCase()}`, "coupons", undefined, {
      discountType,
      discountValue,
    });
    toast.success("Coupon created");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          New Coupon
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create coupon</DialogTitle>
          <DialogDescription>Discounts are validated and applied server-side at booking.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              className="mt-1.5 uppercase"
              placeholder="WELCOME50"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="discountType">Type</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as CouponDiscountType)}>
                <SelectTrigger id="discountType" className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat (Rs.)</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="discountValue">Value</Label>
              <Input
                id="discountValue"
                type="number"
                min={0}
                className="mt-1.5"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="minimumFare">Minimum fare (Rs.)</Label>
              <Input
                id="minimumFare"
                type="number"
                min={0}
                className="mt-1.5"
                value={minimumFare}
                onChange={(e) => setMinimumFare(e.target.value)}
              />
            </div>
            {discountType === "percentage" ? (
              <div>
                <Label htmlFor="maximumDiscount">Max discount (Rs.)</Label>
                <Input
                  id="maximumDiscount"
                  type="number"
                  min={0}
                  placeholder="No cap"
                  className="mt-1.5"
                  value={maximumDiscount}
                  onChange={(e) => setMaximumDiscount(e.target.value)}
                />
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="usageLimit">Usage limit</Label>
              <Input
                id="usageLimit"
                type="number"
                min={1}
                placeholder="Unlimited"
                className="mt-1.5"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry date</Label>
              <Input
                id="expiryDate"
                type="date"
                className="mt-1.5"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Create Coupon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
