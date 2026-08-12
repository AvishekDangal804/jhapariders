import type { Metadata } from "next";
import { WalletPageContent } from "@/components/wallet/wallet-page-content";
import { DemoTopupButton } from "@/components/wallet/demo-topup-button";
import { requireProfile } from "@/lib/supabase/require-profile";

export const metadata: Metadata = { title: "Wallet" };

export default async function PassengerWalletPage() {
  const user = await requireProfile("passenger");
  return <WalletPageContent ownerType="passenger" ownerId={user.id} action={<DemoTopupButton />} />;
}
