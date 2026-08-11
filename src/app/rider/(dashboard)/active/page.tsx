import { redirect } from "next/navigation";
import { requireRiderState } from "@/lib/supabase/require-rider";
import { getActiveRideForRider } from "@/lib/rides/queries";

export default async function RiderActiveRidePage() {
  const state = await requireRiderState();
  const activeRide = await getActiveRideForRider(state.user.id);

  redirect(activeRide ? `/rider/ride/${activeRide.id}` : "/rider");
}
