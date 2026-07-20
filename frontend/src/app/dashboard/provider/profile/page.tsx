"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";

import { api } from "@/lib/api";
import { RequireRole } from "@/components/auth/require-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Category, Provider } from "@/types";

const profileSchema = z.object({
  category_id: z.string().min(1, "Choose a category"),
  description: z.string().optional(),
  experience: z.string().optional(),
  hourly_rate: z.string().optional(),
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

function ProviderProfileInner() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [existing, setExisting] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  const load = useCallback(async () => {
    setLoading(true);
    const [categoriesResp, meResp] = await Promise.all([
      api.get<Category[]>("/categories"),
      api.get("/users/profile"),
    ]);
    setCategories(categoriesResp.data);

    // No "my provider profile" endpoint - match against the public list.
    const allProviders = await api.get<Provider[]>("/providers");
    const own = allProviders.data.find((p) => p.user_id === meResp.data.id) ?? null;
    setExisting(own);

    if (own) {
      reset({
        category_id: String(own.category.id),
        description: own.description ?? "",
        experience: own.experience != null ? String(own.experience) : "",
        hourly_rate: own.hourly_rate != null ? String(own.hourly_rate) : "",
        address: own.address ?? "",
        latitude: own.latitude != null ? String(own.latitude) : "",
        longitude: own.longitude != null ? String(own.longitude) : "",
      });
    }
    setLoading(false);
  }, [reset]);

  useEffect(() => {
    // Initial data fetch on mount - this function is also reused for
    // user-triggered refreshes, so the loading state can't be seeded via
    // useState's initial value instead. Fetching external data in an
    // effect is the pattern React's own docs recommend here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const onSubmit = async (data: ProfileForm) => {
    setServerError(null);
    setSaved(false);
    const payload = {
      category_id: Number(data.category_id),
      description: data.description || undefined,
      experience: data.experience ? Number(data.experience) : undefined,
      hourly_rate: data.hourly_rate ? Number(data.hourly_rate) : undefined,
      address: data.address || undefined,
      latitude: data.latitude ? Number(data.latitude) : undefined,
      longitude: data.longitude ? Number(data.longitude) : undefined,
    };
    try {
      if (existing) {
        await api.put("/providers/profile", payload);
      } else {
        await api.post("/providers/profile", payload);
      }
      setSaved(true);
      setTimeout(() => router.push("/dashboard/provider"), 900);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setServerError(String(err.response.data.detail));
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-black/[0.03]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>{existing ? "Edit your provider profile" : "Create your provider profile"}</CardTitle>
          <CardDescription>
            This is what customers see when they search and view your listing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <Label htmlFor="category_id">Category</Label>
              <Select id="category_id" error={!!errors.category_id} {...register("category_id")}>
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              {errors.category_id && (
                <p className="mt-1.5 text-xs text-danger">{errors.category_id.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell customers about your experience and specialties"
                {...register("description")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="experience">Experience (years)</Label>
                <Input id="experience" type="number" min={0} {...register("experience")} />
              </div>
              <div>
                <Label htmlFor="hourly_rate">Hourly rate (Rs.)</Label>
                <Input id="hourly_rate" type="number" min={0} {...register("hourly_rate")} />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="Model Town, Lahore" {...register("address")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" type="number" step="any" placeholder="31.4805" {...register("latitude")} />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" type="number" step="any" placeholder="74.3260" {...register("longitude")} />
              </div>
            </div>
            <p className="text-xs text-muted">
              Coordinates place your marker on the map on your profile page. You can find these by
              right-clicking your location in Google Maps.
            </p>

            {serverError && (
              <div className="rounded-[var(--radius-control)] bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
                {serverError}
              </div>
            )}
            {saved && (
              <div className="rounded-[var(--radius-control)] bg-success-soft px-3.5 py-2.5 text-sm text-success">
                Saved — redirecting to your dashboard…
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : existing ? "Save changes" : "Create profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProviderProfilePage() {
  return (
    <RequireRole allow={["PROVIDER"]}>
      <ProviderProfileInner />
    </RequireRole>
  );
}
