import { Receipt } from "lucide-react";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { WalletCard } from "@/components/shared/wallet-card";
import { formatNpr } from "@/lib/fare";
import { getWallet, getWalletTransactions } from "@/lib/wallet/queries";

const TYPE_LABEL: Record<string, string> = {
  credit: "Credit",
  debit: "Debit",
  commission: "Commission",
  refund: "Refund",
  withdrawal: "Withdrawal",
  adjustment: "Adjustment",
};

export async function WalletPageContent({
  ownerType,
  ownerId,
  action,
}: {
  ownerType: "passenger" | "rider";
  ownerId: string;
  action?: React.ReactNode;
}) {
  const wallet = await getWallet(ownerType, ownerId);
  const transactions = wallet ? await getWalletTransactions(wallet.id) : [];

  return (
    <Container className="max-w-lg py-6 sm:py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Wallet</h1>
        {action}
      </div>
      <div className="mt-4">
        <WalletCard balance={wallet?.balance ?? 0} />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold">Transactions</h2>
        <div className="mt-3 space-y-2">
          {transactions.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions"
              description="Wallet activity from rides, refunds, and top-ups will appear here."
            />
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{tx.description || TYPE_LABEL[tx.type]}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={
                    tx.type === "debit" || tx.type === "withdrawal"
                      ? "font-semibold text-destructive"
                      : "font-semibold text-primary"
                  }
                >
                  {tx.type === "debit" || tx.type === "withdrawal" ? "-" : "+"}
                  {formatNpr(Math.abs(tx.amount))}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </Container>
  );
}
