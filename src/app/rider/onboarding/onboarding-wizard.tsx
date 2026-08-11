"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/shared/file-upload";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { VehicleType } from "@/types";

const STEPS = ["License", "Vehicle", "Documents", "Emergency Contact", "Review"] as const;

interface WizardState {
  licenseNumber: string;
  licenseDocPath: string | null;
  vehicleType: VehicleType;
  brand: string;
  model: string;
  color: string;
  registrationNumber: string;
  registrationDocPath: string | null;
  insuranceDocPath: string | null;
  emergencyName: string;
  emergencyPhone: string;
}

const initialState: WizardState = {
  licenseNumber: "",
  licenseDocPath: null,
  vehicleType: "bike",
  brand: "",
  model: "",
  color: "",
  registrationNumber: "",
  registrationDocPath: null,
  insuranceDocPath: null,
  emergencyName: "",
  emergencyPhone: "",
};

export function OnboardingWizard({
  userId,
  riderProfileId,
}: {
  userId: string;
  riderProfileId: string;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<WizardState>(initialState);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canContinue() {
    switch (stepIndex) {
      case 0:
        return form.licenseNumber.trim().length > 0 && !!form.licenseDocPath;
      case 1:
        return form.brand.trim() && form.model.trim() && form.registrationNumber.trim();
      case 2:
        return !!form.registrationDocPath && !!form.insuranceDocPath;
      case 3:
        return form.emergencyName.trim() && form.emergencyPhone.trim();
      default:
        return true;
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    const supabase = createClient();

    const { error: profileErr } = await supabase
      .from("rider_profiles")
      .update({
        license_number: form.licenseNumber,
        license_document_url: form.licenseDocPath,
        emergency_contact_name: form.emergencyName,
        emergency_contact_phone: form.emergencyPhone,
      })
      .eq("id", riderProfileId);

    if (profileErr) {
      setSubmitting(false);
      toast.error("Couldn't save your details. Please try again.");
      return;
    }

    const { error: vehicleErr } = await supabase.from("vehicles").insert({
      rider_id: riderProfileId,
      type: form.vehicleType,
      brand: form.brand,
      model: form.model,
      color: form.color || null,
      registration_number: form.registrationNumber,
      registration_document_url: form.registrationDocPath,
      insurance_document_url: form.insuranceDocPath,
    });

    if (vehicleErr) {
      setSubmitting(false);
      toast.error(
        vehicleErr.message.includes("duplicate")
          ? "That registration number is already registered."
          : "Couldn't save your vehicle. Please try again."
      );
      return;
    }

    await supabase.from("rider_documents").insert([
      { rider_id: riderProfileId, document_type: "license", file_url: form.licenseDocPath! },
      {
        rider_id: riderProfileId,
        document_type: "vehicle_registration",
        file_url: form.registrationDocPath!,
      },
      { rider_id: riderProfileId, document_type: "insurance", file_url: form.insuranceDocPath! },
    ]);

    setSubmitting(false);
    toast.success("Application submitted! We'll review it shortly.");
    router.push("/rider");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border bg-card p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        {stepIndex > 0 ? (
          <Button variant="ghost" size="icon" onClick={() => setStepIndex((s) => s - 1)}>
            <ArrowLeft className="size-4" />
          </Button>
        ) : null}
        <div className="flex flex-1 gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className={cn("h-1.5 flex-1 rounded-full", i <= stepIndex ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        Step {stepIndex + 1} of {STEPS.length}
      </p>
      <h1 className="mt-1 text-xl font-bold">{STEPS[stepIndex]}</h1>

      <div className="mt-6 space-y-4">
        {stepIndex === 0 ? (
          <>
            <div>
              <Label htmlFor="licenseNumber">Driving license number</Label>
              <Input
                id="licenseNumber"
                className="mt-1.5"
                value={form.licenseNumber}
                onChange={(e) => update("licenseNumber", e.target.value)}
              />
            </div>
            <FileUpload
              label="License document"
              bucket="rider-documents"
              pathPrefix={`${userId}/license`}
              value={form.licenseDocPath}
              onChange={(v) => update("licenseDocPath", v)}
            />
          </>
        ) : null}

        {stepIndex === 1 ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {(["bike", "car"] as VehicleType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => update("vehicleType", t)}
                  className={cn(
                    "rounded-xl border py-3 text-sm font-medium capitalize",
                    form.vehicleType === t ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" className="mt-1.5" value={form.brand} onChange={(e) => update("brand", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input id="model" className="mt-1.5" value={form.model} onChange={(e) => update("model", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="color">Color</Label>
                <Input id="color" className="mt-1.5" value={form.color} onChange={(e) => update("color", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="registrationNumber">Registration number</Label>
                <Input
                  id="registrationNumber"
                  className="mt-1.5"
                  value={form.registrationNumber}
                  onChange={(e) => update("registrationNumber", e.target.value)}
                />
              </div>
            </div>
          </>
        ) : null}

        {stepIndex === 2 ? (
          <>
            <FileUpload
              label="Vehicle registration document"
              bucket="rider-documents"
              pathPrefix={`${userId}/vehicle-registration`}
              value={form.registrationDocPath}
              onChange={(v) => update("registrationDocPath", v)}
            />
            <FileUpload
              label="Insurance document"
              bucket="rider-documents"
              pathPrefix={`${userId}/insurance`}
              value={form.insuranceDocPath}
              onChange={(v) => update("insuranceDocPath", v)}
            />
          </>
        ) : null}

        {stepIndex === 3 ? (
          <>
            <div>
              <Label htmlFor="emergencyName">Emergency contact name</Label>
              <Input
                id="emergencyName"
                className="mt-1.5"
                value={form.emergencyName}
                onChange={(e) => update("emergencyName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="emergencyPhone">Emergency contact phone</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                className="mt-1.5"
                value={form.emergencyPhone}
                onChange={(e) => update("emergencyPhone", e.target.value)}
              />
            </div>
          </>
        ) : null}

        {stepIndex === 4 ? (
          <div className="space-y-3 text-sm">
            <Row label="License" value={form.licenseNumber} />
            <Row label="Vehicle" value={`${form.brand} ${form.model} (${form.vehicleType})`} />
            <Row label="Registration No." value={form.registrationNumber} />
            <Row label="Emergency Contact" value={`${form.emergencyName} · ${form.emergencyPhone}`} />
            <p className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
              Your application will be reviewed by our team. You&apos;ll be notified once you&apos;re
              approved to start accepting rides.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-8">
        {stepIndex === STEPS.length - 1 ? (
          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Submit Application
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={() => setStepIndex((s) => s + 1)}
            disabled={!canContinue()}
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
