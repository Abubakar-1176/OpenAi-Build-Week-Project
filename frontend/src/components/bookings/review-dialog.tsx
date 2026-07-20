"use client";

import { useState } from "react";
import axios from "axios";
import { Star, X } from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Booking } from "@/types";

export function ReviewDialog({
  booking,
  onClose,
  onSubmitted,
}: {
  booking: Booking;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/reviews", { booking_id: booking.id, rating, comment: comment || undefined });
      onSubmitted();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(String(err.response.data.detail));
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Leave a review</CardTitle>
          <button onClick={onClose} className="text-muted hover:text-foreground" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    n <= rating ? "fill-accent text-accent" : "fill-none text-border"
                  )}
                />
              </button>
            ))}
          </div>

          <Textarea
            className="mt-4"
            placeholder="How did it go? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          {error && <p className="mt-2 text-xs text-danger">{error}</p>}

          <Button className="mt-4 w-full" onClick={submit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit review"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
