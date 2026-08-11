import { NextResponse } from "next/server";
import { z } from "zod";
import { computeServerFare } from "@/lib/fare/server";

const fareRequestSchema = z.object({
  pickup: z.object({
    address: z.string(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  destination: z.object({
    address: z.string(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  serviceType: z.enum(["bike", "car"]),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = fareRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await computeServerFare(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't calculate fare";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
