"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CalendarDays } from "lucide-react";

import { api } from "@/lib/api";
import { RequireRole } from "@/components/auth/require-role";
import { Card } from "@/components/ui/card";
import { BookingCard } from "@/components/bookings/booking-card";
import { ReviewDialog } from "@/components/bookings/review-dialog";
import type { Booking, Notification, Provider } from "@/types";

const GROUPS: { key: string; label: string; statuses: string[] }[] = [
  { key: "upcoming", label: "Upcoming", statuses: ["PENDING", "ACCEPTED"] },
  { key: "completed", label: "Completed", statuses: ["COMPLETED"] },
  { key: "other", label: "Cancelled & rejected", statuses: ["CANCELLED", "REJECTED"] },
];

function CustomerDashboardInner() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providerNames, setProviderNames] = useState<Record<number, string>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [bookingsResp, providersResp, notifResp] = await Promise.all([
      api.get<Booking[]>("/bookings"),
      api.get<Provider[]>("/providers"),
      api.get<Notification[]>("/notifications"),
    ]);
    setBookings(bookingsResp.data);
    setProviderNames(
      Object.fromEntries(providersResp.data.map((p) => [p.id, p.provider_name ?? "Provider"]))
    );
    setNotifications(notifResp.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial data fetch on mount - this function is also reused for
    // user-triggered refreshes, so the loading state can't be seeded via
    // useState's initial value instead. Fetching external data in an
    // effect is the pattern React's own docs recommend here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const markRead = async (id: number) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-medium text-foreground">My bookings</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="h-24 animate-pulse bg-black/[0.03]" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <Card className="p-10 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-muted" />
              <p className="mt-3 text-muted">No bookings yet. Find a professional to get started.</p>
            </Card>
          ) : (
            GROUPS.map((group) => {
              const items = bookings.filter((b) => group.statuses.includes(b.status));
              if (items.length === 0) return null;
              return (
                <div key={group.key}>
                  <h2 className="font-display text-lg font-medium text-foreground">{group.label}</h2>
                  <div className="mt-3 space-y-3">
                    {items.map((b) => (
                      <BookingCard
                        key={b.id}
                        booking={b}
                        viewerRole="CUSTOMER"
                        providerName={providerNames[b.provider_id]}
                        onChanged={load}
                        onReview={setReviewTarget}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-medium text-foreground">
            <Bell className="h-4 w-4" /> Notifications
          </h2>
          <div className="mt-3 space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full rounded-[var(--radius-control)] border border-border p-3 text-left text-sm transition-colors ${
                    n.is_read ? "bg-card text-muted" : "bg-primary-soft text-foreground"
                  }`}
                >
                  <div className="font-medium">{n.title}</div>
                  <div className="mt-0.5 text-xs">{n.message}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {reviewTarget && (
        <ReviewDialog
          booking={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() => {
            setReviewTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <RequireRole allow={["CUSTOMER"]}>
      <CustomerDashboardInner />
    </RequireRole>
  );
}
