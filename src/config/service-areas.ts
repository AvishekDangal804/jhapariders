import type { GeoPoint } from "@/types";

// Static seed list for the marketing site and local UI fallbacks.
// The authoritative, admin-editable source of truth is the `service_areas`
// table introduced in Phase 3 (Supabase). Nothing in the passenger/rider/admin
// apps should hard-code this list directly — always read from the database
// there. This file exists so the public site can render before the database
// is wired up, and to seed the migration's demo data.
export interface ServiceAreaSeed extends GeoPoint {
  slug: string;
  name: string;
  isActive: boolean;
}

export const jhapaServiceAreas: ServiceAreaSeed[] = [
  { slug: "birtamode", name: "Birtamode", lat: 26.6425, lng: 87.9974, isActive: true },
  { slug: "damak", name: "Damak", lat: 26.6667, lng: 87.7, isActive: true },
  { slug: "mechinagar", name: "Mechinagar", lat: 26.6586, lng: 88.145, isActive: true },
  { slug: "kakarbhitta", name: "Kakarbhitta", lat: 26.6551, lng: 88.1728, isActive: true },
  { slug: "dhulabari", name: "Dhulabari", lat: 26.6167, lng: 88.1333, isActive: true },
  { slug: "charali", name: "Charali", lat: 26.6197, lng: 88.0667, isActive: true },
  { slug: "bhadrapur", name: "Bhadrapur", lat: 26.5444, lng: 88.0999, isActive: true },
  { slug: "chandragadhi", name: "Chandragadhi", lat: 26.5667, lng: 88.0833, isActive: true },
  { slug: "kankai", name: "Kankai", lat: 26.5833, lng: 87.9333, isActive: true },
  { slug: "surunga", name: "Surunga", lat: 26.5833, lng: 87.9833, isActive: true },
  { slug: "budhabare", name: "Budhabare", lat: 26.5978, lng: 88.0367, isActive: true },
  { slug: "arjundhara", name: "Arjundhara", lat: 26.6167, lng: 87.95, isActive: true },
  { slug: "shivasatakshi", name: "Shivasatakshi", lat: 26.5, lng: 87.85, isActive: false },
  { slug: "gauradaha", name: "Gauradaha", lat: 26.5333, lng: 87.8667, isActive: false },
];

export const jhapaMapCenter: GeoPoint = { lat: 26.605, lng: 87.99 };
