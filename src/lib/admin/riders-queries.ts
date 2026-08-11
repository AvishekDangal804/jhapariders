import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { VerificationStatus } from "@/types";

export interface AdminRiderRow {
  riderProfileId: string;
  userId: string;
  fullName: string;
  phone: string;
  verificationStatus: VerificationStatus;
  isOnline: boolean;
  ratingAvg: number;
  totalRides: number;
  createdAt: string;
  vehicleSummary: string | null;
}

interface RiderRow {
  id: string;
  user_id: string;
  verification_status: VerificationStatus;
  is_online: boolean;
  rating_avg: number;
  total_rides: number;
  created_at: string;
  profile: { full_name: string; phone: string } | { full_name: string; phone: string }[] | null;
  vehicles: { type: string; brand: string | null; model: string | null }[] | null;
}

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

const PAGE_SIZE = 15;

export async function getRiders({
  page,
  status,
}: {
  page: number;
  status?: VerificationStatus | "all";
}): Promise<{ riders: AdminRiderRow[]; totalPages: number }> {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("rider_profiles")
    .select(
      "id, user_id, verification_status, is_online, rating_avg, total_rides, created_at, profile:profiles!rider_profiles_user_id_fkey(full_name, phone), vehicles(type, brand, model)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("verification_status", status);
  }

  const { data, count } = await query.range(from, to).returns<RiderRow[]>();

  return {
    riders: (data ?? []).map((row) => {
      const profile = one(row.profile);
      const vehicle = row.vehicles?.[0];
      return {
        riderProfileId: row.id,
        userId: row.user_id,
        fullName: profile?.full_name ?? "Unknown",
        phone: profile?.phone ?? "",
        verificationStatus: row.verification_status,
        isOnline: row.is_online,
        ratingAvg: row.rating_avg,
        totalRides: row.total_rides,
        createdAt: row.created_at,
        vehicleSummary: vehicle ? `${vehicle.brand ?? ""} ${vehicle.model ?? ""}`.trim() || vehicle.type : null,
      };
    }),
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}

export interface AdminRiderDetail {
  riderProfileId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string | null;
  verificationStatus: VerificationStatus;
  licenseNumber: string | null;
  licenseDocumentUrl: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  isOnline: boolean;
  ratingAvg: number;
  totalRides: number;
  createdAt: string;
  vehicles: {
    id: string;
    type: string;
    brand: string | null;
    model: string | null;
    color: string | null;
    registrationNumber: string;
    status: string;
    registrationDocumentUrl: string | null;
    insuranceDocumentUrl: string | null;
  }[];
  documents: {
    id: string;
    documentType: string;
    fileUrl: string;
    status: VerificationStatus;
    uploadedAt: string;
  }[];
}

export async function getRiderDetail(riderProfileId: string): Promise<AdminRiderDetail | null> {
  const supabase = await createClient();

  const { data: rider } = await supabase
    .from("rider_profiles")
    .select(
      "id, user_id, verification_status, license_number, license_document_url, emergency_contact_name, emergency_contact_phone, is_online, rating_avg, total_rides, created_at, profile:profiles!rider_profiles_user_id_fkey(full_name, email, phone, address)"
    )
    .eq("id", riderProfileId)
    .maybeSingle<{
      id: string;
      user_id: string;
      verification_status: VerificationStatus;
      license_number: string | null;
      license_document_url: string | null;
      emergency_contact_name: string | null;
      emergency_contact_phone: string | null;
      is_online: boolean;
      rating_avg: number;
      total_rides: number;
      created_at: string;
      profile: { full_name: string; email: string; phone: string; address: string | null } | { full_name: string; email: string; phone: string; address: string | null }[] | null;
    }>();

  if (!rider) return null;
  const profile = one(rider.profile);

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, type, brand, model, color, registration_number, status, registration_document_url, insurance_document_url")
    .eq("rider_id", riderProfileId)
    .returns<
      {
        id: string;
        type: string;
        brand: string | null;
        model: string | null;
        color: string | null;
        registration_number: string;
        status: string;
        registration_document_url: string | null;
        insurance_document_url: string | null;
      }[]
    >();

  const { data: documents } = await supabase
    .from("rider_documents")
    .select("id, document_type, file_url, status, uploaded_at")
    .eq("rider_id", riderProfileId)
    .returns<{ id: string; document_type: string; file_url: string; status: VerificationStatus; uploaded_at: string }[]>();

  return {
    riderProfileId: rider.id,
    userId: rider.user_id,
    fullName: profile?.full_name ?? "Unknown",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    address: profile?.address ?? null,
    verificationStatus: rider.verification_status,
    licenseNumber: rider.license_number,
    licenseDocumentUrl: rider.license_document_url,
    emergencyContactName: rider.emergency_contact_name,
    emergencyContactPhone: rider.emergency_contact_phone,
    isOnline: rider.is_online,
    ratingAvg: rider.rating_avg,
    totalRides: rider.total_rides,
    createdAt: rider.created_at,
    vehicles: (vehicles ?? []).map((v) => ({
      id: v.id,
      type: v.type,
      brand: v.brand,
      model: v.model,
      color: v.color,
      registrationNumber: v.registration_number,
      status: v.status,
      registrationDocumentUrl: v.registration_document_url,
      insuranceDocumentUrl: v.insurance_document_url,
    })),
    documents: (documents ?? []).map((d) => ({
      id: d.id,
      documentType: d.document_type,
      fileUrl: d.file_url,
      status: d.status,
      uploadedAt: d.uploaded_at,
    })),
  };
}
