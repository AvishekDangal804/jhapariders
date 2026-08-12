import type { Metadata } from "next";
import { WalletPageContent } from "@/components/wallet/wallet-page-content";
import { WithdrawalRequestButton } from "@/components/wallet/withdrawal-request-button";
import { requireRiderState } from "@/lib/supabase/require-rider";
import { getWallet } from "@/lib/wallet/queries";

export const metadata: Metadata = { title: "Wallet" };

export default async function RiderWalletPage() {
  const state = await requireRiderState();
  const wallet = await getWallet("rider", state.user.id);

  return (
    <WalletPageContent
      ownerType="rider"
      ownerId={state.user.id}
      action={<WithdrawalRequestButton balance={wallet?.balance ?? 0} />}
    />
  );
}
