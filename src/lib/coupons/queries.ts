import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Coupon } from "@/types";

interface CouponRow {
  id: string;
  code: string;
  discount_type: Coupon["discountType"];
  discount_value: number;
  minimum_fare: number;
  maximum_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  expiry_date: string | null;
  is_active: boolean;
  created_at: string;
}

function mapCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    minimumFare: row.minimum_fare,
    maximumDiscount: row.maximum_discount,
    usageLimit: row.usage_limit,
    usageCount: row.usage_count,
    expiryDate: row.expiry_date,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function getCoupons(): Promise<Coupon[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coupons")
    .select("id, code, discount_type, discount_value, minimum_fare, maximum_discount, usage_limit, usage_count, expiry_date, is_active, created_at")
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<CouponRow[]>();

  return (data ?? []).map(mapCoupon);
}
