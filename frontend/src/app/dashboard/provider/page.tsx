"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Settings, CalendarClock, Wallet } from "lucide-react";

import { api } from "@/lib/api";
import { RequireRole } from "@/components/auth/require-role";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { BookingCard } from "@/components/bookings/booking-card";
import type { Booking, Provider, Review } from "@/types";

function ProviderDashboardInner() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [noProfile, setNoProfile] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const bookingsResp = await api.get<Booking[]>("/bookings");
      setBookings(bookingsResp.data);

      // No "my provider profile" endpoint exists, so we match the current
      // user against the public providers list by user_id. Fine at
      // hackathon scale; would add a dedicated endpoint if this list grows.
      const me = await api.get("/users/profile");
      const allProviders = await api.get<Provider[]>("/providers");
      const own = allProviders.data.find((p) => p.user_id === me.data.id) ?? null;
      setProfile(own);
      setNoProfile(!own);

      if (own) {
        const reviewsResp = await api.get<Review[]>(`/providers/${own.id}/reviews`);
        setReviews(reviewsResp.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial data fetch on mount - this function is also reused for
    // user-triggered refreshes, so the loading state can't be seeded via
    // useState's initial value instead. Fetching external data in an
    // effect is the pattern React's own docs recommend here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const pending = bookings.filter((b) => b.status === "PENDING");
  const active = bookings.filter((b) => b.status === "ACCEPTED");
  const completed = bookings.filter((b) => b.status === "COMPLETED");
  const earnings = completed.length * (profile?.hourly_rate ?? 0);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-24 animate-pulse bg-black/[0.03]" />
          ))}
        </div>
      </div>
    );
  }

  if (noProfile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-2xl font-medium text-foreground">Set up your provider profile</h1>
        <p className="mt-2 text-muted">
          Add your category, rate, and description so customers can find and book you.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard/provider/profile">Create profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-medium text-foreground">Provider dashboard</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/provider/availability">
              <CalendarClock className="h-4 w-4" /> Availability
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/provider/profile">
              <Settings className="h-4 w-4" /> Edit profile
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-muted">Pending requests</div>
          <div className="mt-1 font-tabular text-2xl font-medium text-foreground">{pending.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted">Accepted</div>
          <div className="mt-1 font-tabular text-2xl font-medium text-foreground">{active.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted">Completed jobs</div>
          <div className="mt-1 font-tabular text-2xl font-medium text-foreground">{completed.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-1 text-xs text-muted">
            <Wallet className="h-3.5 w-3.5" /> Est. earnings
          </div>
          <div className="mt-1 font-tabular text-2xl font-medium text-foreground">Rs. {earnings}</div>
        </Card>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-lg font-medium text-foreground">Booking requests</h2>
            <div className="mt-3 space-y-3">
              {pending.length === 0 && active.length === 0 ? (
                <p className="text-sm text-muted">No pending or active bookings.</p>
              ) : (
                [...pending, ...active].map((b) => (
                  <BookingCard key={b.id} booking={b} viewerRole="PROVIDER" onChanged={load} />
                ))
              )}
            </div>
          </div>

          {completed.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-medium text-foreground">Completed jobs</h2>
              <div className="mt-3 space-y-3">
                {completed.map((b) => (
                  <BookingCard key={b.id} booking={b} viewerRole="PROVIDER" onChanged={load} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-medium text-foreground">
            Reviews {reviews.length > 0 && `(${reviews.length})`}
          </h2>
          <div className="mt-3 space-y-2">
            {reviews.length === 0 ? (
              <p className="text-sm text-muted">No reviews yet.</p>
            ) : (
              reviews.map((r) => (
                <Card key={r.id} className="p-3.5">
                  <StarRating rating={r.rating} showValue={false} />
                  {r.comment && <p className="mt-1.5 text-sm text-foreground/90">{r.comment}</p>}
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProviderDashboardPage() {
  return (
    <RequireRole allow={["PROVIDER"]}>
      <ProviderDashboardInner />
    </RequireRole>
  );
}
