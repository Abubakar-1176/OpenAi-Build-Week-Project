import { notFound } from "next/navigation";
import axios from "axios";

import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { StarRating } from "@/components/ui/star-rating";
import { LocationMap } from "@/components/ui/location-map";
import { BookingForm } from "@/components/bookings/booking-form";
import type { Provider, Review, Availability } from "@/types";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

async function getProvider(id: string): Promise<Provider | null> {
  try {
    const resp = await api.get<Provider>(`/providers/${id}`);
    return resp.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

async function getReviews(id: string): Promise<Review[]> {
  try {
    const resp = await api.get<Review[]>(`/providers/${id}/reviews`);
    return resp.data;
  } catch {
    return [];
  }
}

async function getAvailability(id: string): Promise<Availability[]> {
  try {
    const resp = await api.get<Availability[]>(`/providers/${id}/availability`);
    return resp.data;
  } catch {
    return [];
  }
}

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const provider = await getProvider(id);
  if (!provider) notFound();

  const [reviews, availability] = await Promise.all([getReviews(id), getAvailability(id)]);

  const availabilityByDay = new Map<string, Availability[]>();
  for (const slot of availability) {
    const list = availabilityByDay.get(slot.day) ?? [];
    list.push(slot);
    availabilityByDay.set(slot.day, list);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-2xl font-medium text-primary">
              {(provider.provider_name ?? "?").charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-medium text-foreground">
                  {provider.provider_name}
                </h1>
                {provider.verified && <VerifiedBadge />}
              </div>
              <p className="mt-0.5 text-sm text-muted">
                {provider.category.name}
                {provider.experience ? ` · ${provider.experience} years experience` : ""}
              </p>
              <div className="mt-1.5">
                <StarRating rating={provider.average_rating} size="md" />
              </div>
            </div>
          </div>

          {/* Description */}
          {provider.description && (
            <p className="mt-6 text-sm leading-relaxed text-foreground/90">{provider.description}</p>
          )}

          {/* Address + rate */}
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            {provider.address && (
              <div>
                <div className="text-xs font-medium text-muted">Location</div>
                <div className="mt-0.5 text-foreground">{provider.address}</div>
              </div>
            )}
            <div>
              <div className="text-xs font-medium text-muted">Rate</div>
              <div className="mt-0.5 font-tabular text-foreground">
                {provider.hourly_rate ? `Rs. ${provider.hourly_rate}/hr` : "On request"}
              </div>
            </div>
          </div>

          {/* Location map - shows a real Google Map if a key is configured,
              otherwise falls back gracefully to a coordinate label */}
          {provider.latitude != null && provider.longitude != null && (
            <div className="mt-6">
              <div className="text-xs font-medium text-muted">Location</div>
              <div className="mt-2">
                <LocationMap
                  latitude={provider.latitude}
                  longitude={provider.longitude}
                  label={provider.provider_name ?? "Provider"}
                />
              </div>
            </div>
          )}

          {/* Availability */}
          <div className="mt-8">
            <h2 className="font-display text-lg font-medium text-foreground">Availability</h2>
            {availability.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No availability listed yet — request a booking anyway and the provider can confirm a time.</p>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {DAY_ORDER.filter((d) => availabilityByDay.has(d)).map((day) => (
                  <Card key={day} className="p-3.5">
                    <div className="text-sm font-medium text-foreground">{day}</div>
                    <div className="mt-1 space-y-0.5 font-tabular text-xs text-muted">
                      {availabilityByDay.get(day)!.map((slot) => (
                        <div key={slot.id}>
                          {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="mt-8">
            <h2 className="font-display text-lg font-medium text-foreground">
              Reviews {reviews.length > 0 && `(${reviews.length})`}
            </h2>
            {reviews.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No reviews yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {reviews.map((r) => (
                  <Card key={r.id} className="p-4">
                    <StarRating rating={r.rating} showValue={false} />
                    {r.comment && <p className="mt-2 text-sm text-foreground/90">{r.comment}</p>}
                    <p className="mt-2 text-xs text-muted">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking sidebar */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <BookingForm providerId={provider.id} />
        </div>
      </div>
    </div>
  );
}
