import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { Container } from "@/components/shared/container";
import { ViewDocumentButton } from "@/components/shared/view-document-button";
import { VerificationStatusBadge } from "@/components/rides/verification-status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRiderDetail } from "@/lib/admin/riders-queries";
import { VerificationActions } from "./verification-actions";

export const metadata: Metadata = { title: "Rider Verification" };

const DOC_LABEL: Record<string, string> = {
  license: "Driving License",
  vehicle_registration: "Vehicle Registration",
  insurance: "Insurance",
};

export default async function AdminRiderDetailPage({ params }: PageProps<"/admin/riders/[id]">) {
  const { id } = await params;
  const rider = await getRiderDetail(id);
  if (!rider) notFound();

  const vehicle = rider.vehicles[0];

  return (
    <Container className="max-w-3xl py-6 sm:py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback className="bg-primary/10 text-primary">
              {rider.fullName
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-semibold">{rider.fullName}</h1>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {rider.ratingAvg.toFixed(1)} · {rider.totalRides} rides
            </p>
          </div>
        </div>
        <VerificationStatusBadge status={rider.verificationStatus} />
      </div>

      <div className="mt-6">
        <VerificationActions
          riderProfileId={rider.riderProfileId}
          vehicleId={vehicle?.id ?? null}
          currentStatus={rider.verificationStatus}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Email" value={rider.email} />
          <Field label="Phone" value={rider.phone} />
          <Field label="Address" value={rider.address ?? "—"} />
          <Field label="License Number" value={rider.licenseNumber ?? "—"} />
          <Field label="Emergency Contact" value={rider.emergencyContactName ?? "—"} />
          <Field label="Emergency Phone" value={rider.emergencyContactPhone ?? "—"} />
        </CardContent>
      </Card>

      {vehicle ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Type" value={vehicle.type} />
            <Field label="Brand / Model" value={`${vehicle.brand ?? ""} ${vehicle.model ?? ""}`.trim() || "—"} />
            <Field label="Color" value={vehicle.color ?? "—"} />
            <Field label="Registration No." value={vehicle.registrationNumber} />
            <div className="col-span-2 flex items-center gap-2">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className="capitalize">
                {vehicle.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rider.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded.</p>
          ) : (
            rider.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm">
                <div>
                  <p className="font-medium">{DOC_LABEL[doc.documentType] ?? doc.documentType}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <VerificationStatusBadge status={doc.status} />
                  <ViewDocumentButton bucket="rider-documents" path={doc.fileUrl} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
