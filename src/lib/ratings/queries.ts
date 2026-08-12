import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface MyRating {
  stars: number;
  review: string | null;
}

export async function getMyRatingForRide(rideId: string, raterId: string): Promise<MyRating | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ratings")
    .select("stars, review")
    .eq("ride_id", rideId)
    .eq("rater_id", raterId)
    .maybeSingle<MyRating>();

  return data ?? null;
}
