import type { Metadata } from "next";
import { WalletPageContent } from "@/components/wallet/wallet-page-content";
import { requireRiderState } from "@/lib/supabase/require-rider";

export const metadata: Metadata = { title: "Wallet" };

export default async function RiderWalletPage() {
  const state = await requireRiderState();
  return <WalletPageContent ownerType="rider" ownerId={state.user.id} />;
}
