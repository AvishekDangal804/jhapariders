import type { Metadata } from "next";
import { Bike, Car, FileText } from "lucide-react";
import { Container } from "@/components/shared/container";
import { ViewDocumentButton } from "@/components/shared/view-document-button";
import { VerificationStatusBadge } from "@/components/rides/verification-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRiderState } from "@/lib/supabase/require-rider";
import { getRiderDocuments, getRiderVehicles } from "@/lib/documents/queries";

export const metadata: Metadata = { title: "Documents" };

const DOC_LABEL: Record<string, string> = {
  license: "Driving License",
  vehicle_registration: "Vehicle Registration",
  insurance: "Insurance",
};

export default async function RiderDocumentsPage() {
  const state = await requireRiderState();
  const [documents, vehicles] = await Promise.all([
    getRiderDocuments(state.riderProfileId),
    getRiderVehicles(state.riderProfileId),
  ]);

  return (
    <Container className="max-w-lg py-6 sm:py-8">
      <h1 className="text-lg font-semibold">Documents</h1>

      {vehicles.length > 0 ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {vehicles[0].type === "car" ? <Car className="size-4" /> : <Bike className="size-4" />}
              Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vehicles.map((v) => (
              <div key={v.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">
                    {v.brand} {v.model} {v.color ? `· ${v.color}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{v.registrationNumber}</p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {v.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 space-y-3">
        <h2 className="text-sm font-semibold">Uploaded documents</h2>
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm"
          >
            <div className="flex items-center gap-3">
              <FileText className="size-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{DOC_LABEL[doc.documentType] ?? doc.documentType}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <VerificationStatusBadge status={doc.status} />
              <ViewDocumentButton bucket="rider-documents" path={doc.fileUrl} />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
