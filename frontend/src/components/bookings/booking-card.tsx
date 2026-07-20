"use client";

import { useState } from "react";
import axios from "axios";
import { MapPin, StickyNote, Banknote, CreditCard } from "lucide-react";

import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/ui/badge";
import type { Booking } from "@/types";

export function BookingCard({
  booking,
  viewerRole,
  providerName,
  onChanged,
  onReview,
}: {
  booking: Booking;
  viewerRole: "CUSTOMER" | "PROVIDER";
  providerName?: string;
  onChanged: () => void;
  onReview?: (booking: Booking) => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (action: "accept" | "reject" | "complete" | "cancel") => {
    setLoading(action);
    setError(null);
    try {
      if (action === "cancel") {
        await api.delete(`/bookings/${booking.id}`);
      } else {
        await api.put(`/bookings/${booking.id}/${action}`);
      }
      onChanged();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(String(err.response.data.detail));
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(null);
    }
  };

  const canCancel = !["COMPLETED", "CANCELLED", "REJECTED"].includes(booking.status);

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-tabular text-sm font-medium text-foreground">
              {booking.booking_date} · {booking.booking_time.slice(0, 5)}
            </span>
            <BookingStatusBadge status={booking.status} />
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <PaymentStatusBadge status={booking.payment_status} />
            <span className="flex items-center gap-1 text-xs text-muted">
              {booking.payment_method === "CASH" ? (
                <Banknote className="h-3 w-3" />
              ) : (
                <CreditCard className="h-3 w-3" />
              )}
              {booking.payment_method === "CASH" ? "Cash" : "Online (demo)"}
            </span>
          </div>
          {viewerRole === "CUSTOMER" && providerName && (
            <p className="mt-1 text-sm text-muted">with {providerName}</p>
          )}
        </div>
      </div>

      {booking.address && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {booking.address}
        </p>
      )}
      {booking.notes && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <StickyNote className="h-3.5 w-3.5 shrink-0" />
          {booking.notes}
        </p>
      )}

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {viewerRole === "PROVIDER" && booking.status === "PENDING" && (
          <>
            <Button size="sm" onClick={() => act("accept")} disabled={loading !== null}>
              {loading === "accept" ? "Accepting…" : "Accept"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => act("reject")} disabled={loading !== null}>
              {loading === "reject" ? "Rejecting…" : "Reject"}
            </Button>
          </>
        )}
        {viewerRole === "PROVIDER" && booking.status === "ACCEPTED" && (
          <Button size="sm" onClick={() => act("complete")} disabled={loading !== null}>
            {loading === "complete" ? "Completing…" : "Mark completed"}
          </Button>
        )}
        {viewerRole === "CUSTOMER" && booking.status === "COMPLETED" && onReview && (
          <Button size="sm" variant="accent" onClick={() => onReview(booking)}>
            Leave a review
          </Button>
        )}
        {canCancel && (
          <Button size="sm" variant="outline" onClick={() => act("cancel")} disabled={loading !== null}>
            {loading === "cancel" ? "Cancelling…" : "Cancel"}
          </Button>
        )}
      </div>
    </Card>
  );
}
