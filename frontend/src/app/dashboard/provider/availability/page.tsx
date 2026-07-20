"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Trash2, Plus } from "lucide-react";

import { api } from "@/lib/api";
import { RequireRole } from "@/components/auth/require-role";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Availability, Provider } from "@/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function AvailabilityInner() {
  const [profile, setProfile] = useState<Provider | null>(null);
  const [slots, setSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const meResp = await api.get("/users/profile");
    const allProviders = await api.get<Provider[]>("/providers");
    const own = allProviders.data.find((p) => p.user_id === meResp.data.id) ?? null;
    setProfile(own);

    if (own) {
      const slotsResp = await api.get<Availability[]>(`/providers/${own.id}/availability`);
      setSlots(slotsResp.data);
    }
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

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post("/availability", {
        day,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
      });
      await load();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        const detail = err.response.data.detail;
        setFormError(typeof detail === "string" ? detail : "Invalid time range.");
      } else {
        setFormError("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const removeSlot = async (id: number) => {
    setDeletingId(id);
    try {
      await api.delete(`/availability/${id}`);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-black/[0.03]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-2xl font-medium text-foreground">Create your profile first</h1>
        <p className="mt-2 text-muted">
          Set up your provider profile before adding your availability schedule.
        </p>
        <Button asChild className="mt-6">
          <a href="/dashboard/provider/profile">Create profile</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-medium text-foreground">Availability</h1>
      <p className="mt-1 text-muted">Add the days and hours customers can book you.</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Add a slot</CardTitle>
          <CardDescription>Slots can&apos;t overlap an existing one on the same day.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addSlot} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="day">Day</Label>
              <Select id="day" value={day} onChange={(e) => setDay(e.target.value)}>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="start">Start</Label>
              <Input
                id="start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end">End</Label>
              <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <Button type="submit" disabled={submitting}>
              <Plus className="h-4 w-4" />
              {submitting ? "Adding…" : "Add"}
            </Button>
          </form>
          {formError && <p className="mt-2 text-xs text-danger">{formError}</p>}
        </CardContent>
      </Card>

      <div className="mt-6 space-y-2">
        {slots.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted">
            No availability set yet. Add your first slot above.
          </Card>
        ) : (
          DAYS.filter((d) => slots.some((s) => s.day === d)).map((d) => (
            <Card key={d} className="p-4">
              <div className="text-sm font-medium text-foreground">{d}</div>
              <div className="mt-2 space-y-1.5">
                {slots
                  .filter((s) => s.day === d)
                  .map((s) => (
                    <div key={s.id} className="flex items-center justify-between">
                      <span className="font-tabular text-sm text-muted">
                        {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                      </span>
                      <button
                        onClick={() => removeSlot(s.id)}
                        disabled={deletingId === s.id}
                        className="text-muted hover:text-danger"
                        aria-label={`Remove ${d} ${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function AvailabilityPage() {
  return (
    <RequireRole allow={["PROVIDER"]}>
      <AvailabilityInner />
    </RequireRole>
  );
}
