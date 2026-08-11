import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { VerificationStatus } from "@/types";

export interface RiderDocumentRow {
  id: string;
  documentType: string;
  fileUrl: string;
  status: VerificationStatus;
  uploadedAt: string;
}

export interface RiderVehicleRow {
  id: string;
  type: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  registrationNumber: string;
  status: string;
}

export async function getRiderDocuments(riderProfileId: string): Promise<RiderDocumentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rider_documents")
    .select("id, document_type, file_url, status, uploaded_at")
    .eq("rider_id", riderProfileId)
    .order("uploaded_at", { ascending: false })
    .returns<
      { id: string; document_type: string; file_url: string; status: VerificationStatus; uploaded_at: string }[]
    >();

  return (data ?? []).map((row) => ({
    id: row.id,
    documentType: row.document_type,
    fileUrl: row.file_url,
    status: row.status,
    uploadedAt: row.uploaded_at,
  }));
}

export async function getRiderVehicles(riderProfileId: string): Promise<RiderVehicleRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("id, type, brand, model, color, registration_number, status")
    .eq("rider_id", riderProfileId)
    .returns<
      { id: string; type: string; brand: string | null; model: string | null; color: string | null; registration_number: string; status: string }[]
    >();

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    brand: row.brand,
    model: row.model,
    color: row.color,
    registrationNumber: row.registration_number,
    status: row.status,
  }));
}
