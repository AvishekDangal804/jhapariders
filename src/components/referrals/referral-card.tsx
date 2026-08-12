"use client";

import { useState } from "react";
import { Check, Copy, Gift, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNpr } from "@/lib/fare";
import type { Referral } from "@/types";

export function ReferralCard({
  code,
  history,
  rewardsTotal,
}: {
  code: string | null;
  history: Referral[];
  rewardsTotal: number;
}) {
  const [copied, setCopied] = useState(false);

  const link = code && typeof window !== "undefined" ? `${window.location.origin}/register?ref=${code}` : null;

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — long-press the link to copy manually.");
    }
  }

  async function share() {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join JhapaRide", text: `Use my code ${code} to get started on JhapaRide!`, url: link });
      } catch {
        // user cancelled the share sheet — no-op
      }
    } else {
      copyLink();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="size-4.5 text-primary" />
          Invite friends, earn rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Share your code. When someone signs up and completes their first ride, you earn a reward.
        </p>

        {code ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border bg-secondary/40 px-4 py-3">
            <span className="font-mono text-lg font-semibold tracking-wide">{code}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyLink}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" onClick={share}>
                <Share2 className="size-3.5" />
                Share
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Couldn&apos;t load your referral code. Try refreshing.</p>
        )}

        <div className="flex items-center justify-between border-t pt-3 text-sm">
          <span className="text-muted-foreground">Total earned from referrals</span>
          <span className="font-semibold text-primary">{formatNpr(rewardsTotal)}</span>
        </div>

        {history.length > 0 ? (
          <div className="space-y-2 border-t pt-3">
            {history.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span>{r.referredUserName ?? "A new user"}</span>
                <Badge variant={r.status === "completed" ? "default" : "secondary"} className="capitalize">
                  {r.status === "completed" ? "Rewarded" : "Pending first ride"}
                </Badge>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
