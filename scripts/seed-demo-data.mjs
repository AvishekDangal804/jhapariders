// Creates a small set of permanent demo accounts + a demo coupon so anyone
// reviewing this project can log in immediately without registering.
// Safe to re-run — skips anything that already exists.
//
// Usage: node --env-file=.env.local scripts/seed-demo-data.mjs
// (needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local)

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Run with: node --env-file=.env.local scripts/seed-demo-data.js");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const PASSWORD = "JhapaDemo123!";

const DEMO_USERS = [
  { email: "admin@jhaparide.demo", full_name: "Demo Admin", phone: "+9779800000010", role: "admin" },
  { email: "rider@jhaparide.demo", full_name: "Suman Rai", phone: "+9779800000011", role: "rider" },
  { email: "passenger@jhaparide.demo", full_name: "Nisha Gurung", phone: "+9779800000012", role: "passenger" },
];

async function findExistingUser(email) {
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 200) return null;
    page++;
  }
}

async function main() {
  console.log("Seeding demo accounts...\n");
  const created = {};

  for (const demo of DEMO_USERS) {
    const existing = await findExistingUser(demo.email);
    if (existing) {
      console.log(`- ${demo.email} already exists, skipping creation`);
      created[demo.role] = existing;
      continue;
    }

    // handle_new_user only ever trusts 'passenger'/'rider' from signup
    // metadata (Phase 12 fix) — admin has to be created as a passenger
    // first, then promoted with a direct service-role update below.
    const { data, error } = await admin.auth.admin.createUser({
      email: demo.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: demo.full_name,
        phone: demo.phone,
        role: demo.role === "admin" ? "passenger" : demo.role,
      },
    });
    if (error) throw error;
    created[demo.role] = data.user;

    if (demo.role === "admin") {
      const { error: promoteError } = await admin.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
      if (promoteError) throw promoteError;
    }
    console.log(`- created ${demo.email}`);
  }

  const riderUser = created.rider;
  const { data: riderProfile } = await admin
    .from("rider_profiles")
    .select("id, verification_status")
    .eq("user_id", riderUser.id)
    .single();

  if (riderProfile.verification_status !== "approved") {
    await admin
      .from("rider_profiles")
      .update({
        verification_status: "approved",
        is_online: true,
        license_number: "JHAPA-DEMO-001",
        current_lat: 26.6425,
        current_lng: 87.9974,
      })
      .eq("id", riderProfile.id);
    console.log("- approved demo rider's verification");
  }

  const { data: existingVehicle } = await admin
    .from("vehicles")
    .select("id")
    .eq("rider_id", riderProfile.id)
    .maybeSingle();

  if (!existingVehicle) {
    await admin.from("vehicles").insert({
      rider_id: riderProfile.id,
      type: "bike",
      brand: "Honda",
      model: "Shine",
      registration_number: "BA-1-PA-1000",
      status: "approved",
    });
    console.log("- added demo rider's vehicle");
  }

  const { data: existingCoupon } = await admin.from("coupons").select("id").eq("code", "WELCOME100").maybeSingle();
  if (!existingCoupon) {
    await admin.from("coupons").insert({
      code: "WELCOME100",
      discount_type: "flat",
      discount_value: 100,
      minimum_fare: 0,
      is_active: true,
      created_by: created.admin.id,
    });
    console.log("- created demo coupon WELCOME100 (Rs. 100 off)");
  }

  console.log("\nDone. Demo accounts (all use the same password):\n");
  console.log(`  Admin:     admin@jhaparide.demo`);
  console.log(`  Rider:     rider@jhaparide.demo (pre-approved, online, has a vehicle)`);
  console.log(`  Passenger: passenger@jhaparide.demo`);
  console.log(`  Password:  ${PASSWORD}`);
  console.log(`\nDemo coupon code: WELCOME100 (Rs. 100 flat off, no minimum fare)`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
