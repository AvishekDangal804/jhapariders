import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNpr } from "@/lib/fare";
import type { FareBreakdown } from "@/types";

export function FareCard({ fare }: { fare: FareBreakdown }) {
  const rows: [string, number][] = [
    ["Base fare", fare.baseFare],
    ["Distance", fare.distanceFare],
    ["Time", fare.timeFare],
  ];
  if (fare.waitingCharge > 0) rows.push(["Waiting charge", fare.waitingCharge]);
  if (fare.discount > 0) rows.push(["Discount", -fare.discount]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fare estimate</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          {rows.map(([label, amount]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className={amount < 0 ? "text-primary" : undefined}>
                {amount < 0 ? "-" : ""}
                {formatNpr(Math.abs(amount))}
              </dd>
            </div>
          ))}
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatNpr(fare.total)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          This is an estimate. The final fare is confirmed by the server when your ride ends.
        </p>
      </CardContent>
    </Card>
  );
}
