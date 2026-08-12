"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function RatingForm({
  rideId,
  rateeId,
  rateeName,
  rateeLabel,
}: {
  rideId: string;
  rateeId: string;
  rateeName: string;
  rateeLabel: string;
}) {
  const router = useRouter();
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (stars < 1) {
      toast.error("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("submit_rating", {
      p_ride_id: rideId,
      p_ratee_id: rateeId,
      p_stars: stars,
      p_review: review.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message || "Could not submit rating.");
      return;
    }
    toast.success("Thanks for your feedback!");
    router.refresh();
  }

  const displayStars = hoverStars || stars;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">
          Rate your {rateeLabel} · {rateeName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-1" onMouseLeave={() => setHoverStars(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStars(value)}
              onMouseEnter={() => setHoverStars(value)}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "size-7",
                  value <= displayStars ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
        <Textarea
          placeholder="Leave a review (optional)"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={3}
        />
        <Button onClick={submit} disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Submit Rating
        </Button>
      </CardContent>
    </Card>
  );
}
