"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { logAdminAction } from "@/lib/admin/log-action";

export interface ServiceAreaRow {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  isActive: boolean;
}

export function ServiceAreasManager({ areas }: { areas: ServiceAreaRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function toggleActive(area: ServiceAreaRow) {
    setPendingId(area.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("service_areas")
      .update({ is_active: !area.isActive })
      .eq("id", area.id);
    setPendingId(null);

    if (error) {
      toast.error("Couldn't update this area.");
      return;
    }
    await logAdminAction(area.isActive ? "Deactivated service area" : "Activated service area", "service_areas", area.id);
    router.refresh();
  }

  async function removeArea(area: ServiceAreaRow) {
    setPendingId(area.id);
    const supabase = createClient();
    const { error } = await supabase.from("service_areas").delete().eq("id", area.id);
    setPendingId(null);

    if (error) {
      toast.error("Couldn't remove this area.");
      return;
    }
    await logAdminAction("Removed service area", "service_areas", area.id, { name: area.name });
    toast.success("Area removed");
    router.refresh();
  }

  async function addArea() {
    if (!name.trim() || !lat || !lng) return;
    setSaving(true);
    const supabase = createClient();
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { error } = await supabase.from("service_areas").insert({
      slug,
      name: name.trim(),
      lat: Number(lat),
      lng: Number(lng),
      is_active: true,
    });
    setSaving(false);

    if (error) {
      toast.error(error.message.includes("duplicate") ? "That area already exists." : "Couldn't add area.");
      return;
    }
    await logAdminAction("Added service area", "service_areas", undefined, { name });
    toast.success("Service area added");
    setOpen(false);
    setName("");
    setLat("");
    setLng("");
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              Add Area
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add service area</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="areaName">Name</Label>
                <Input id="areaName" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="areaLat">Latitude</Label>
                  <Input id="areaLat" type="number" step="any" className="mt-1.5" value={lat} onChange={(e) => setLat(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="areaLng">Longitude</Label>
                  <Input id="areaLng" type="number" step="any" className="mt-1.5" value={lng} onChange={(e) => setLng(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addArea} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Coordinates</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  No service areas yet. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              areas.map((area) => (
                <TableRow key={area.id}>
                  <TableCell className="font-medium">{area.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {area.lat.toFixed(4)}, {area.lng.toFixed(4)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={area.isActive}
                      disabled={pendingId === area.id}
                      onCheckedChange={() => toggleActive(area)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={pendingId === area.id}
                      onClick={() => removeArea(area)}
                      aria-label={`Remove ${area.name}`}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
