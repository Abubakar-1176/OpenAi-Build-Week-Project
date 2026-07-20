"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { CalendarCheck, Banknote, CreditCard } from "lucide-react";

import { api } from "@/lib/api";
import { useAuthState } from "@/lib/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PaymentMethod } from "@/types";

const bookingSchema = z.object({
  date: z.string().min(1, "Choose a date"),
  time: z.string().min(1, "Choose a time"),
  address: z.string().min(3, "Enter the service address"),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export function BookingForm({ providerId }: { providerId: number }) {
  const router = useRouter();
  const { authed, role } = useAuthState();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({ resolver: zodResolver(bookingSchema) });

  const onSubmit = async (data: BookingFormValues) => {
    setServerError(null);
    try {
      await api.post("/bookings", {
        provider_id: providerId,
        date: data.date,
        time: `${data.time}:00`,
        address: data.address,
        notes: data.notes || undefined,
        payment_method: paymentMethod,
      });
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setServerError(String(err.response.data.detail));
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
            <CalendarCheck className="h-6 w-6" />
          </span>
          <h3 className="mt-4 font-display text-lg font-medium text-foreground">Booking requested</h3>
          <p className="mt-1 text-sm text-muted">
            The provider will accept or decline shortly. Track it from your dashboard.
          </p>
          <Button className="mt-5 w-full" onClick={() => router.push("/dashboard")}>
            Go to my bookings
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!authed) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted">Log in as a customer to book this provider.</p>
          <Button className="mt-4 w-full" onClick={() => router.push("/login")}>
            Log in to book
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (role !== "CUSTOMER") {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted">
          Only customer accounts can book services.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book this provider</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" error={!!errors.date} {...register("date")} />
              {errors.date && <p className="mt-1.5 text-xs text-danger">{errors.date.message}</p>}
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" error={!!errors.time} {...register("time")} />
              {errors.time && <p className="mt-1.5 text-xs text-danger">{errors.time.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="address">Service address</Label>
            <Input
              id="address"
              placeholder="House 12, Gulberg, Lahore"
              error={!!errors.address}
              {...register("address")}
            />
            {errors.address && <p className="mt-1.5 text-xs text-danger">{errors.address.message}</p>}
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" placeholder="Anything the provider should know?" {...register("notes")} />
          </div>

          <div>
            <Label>Payment method</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-[var(--radius-control)] border px-3 py-3 text-sm font-medium transition-colors",
                  paymentMethod === "CASH"
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border text-muted hover:border-primary/50"
                )}
              >
                <Banknote className="h-5 w-5" />
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("DEMO_ONLINE")}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-[var(--radius-control)] border px-3 py-3 text-sm font-medium transition-colors",
                  paymentMethod === "DEMO_ONLINE"
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border text-muted hover:border-primary/50"
                )}
              >
                <CreditCard className="h-5 w-5" />
                Pay online (demo)
              </button>
            </div>
            {paymentMethod === "DEMO_ONLINE" && (
              <p className="mt-1.5 text-xs text-muted">
                No real payment gateway is connected — this simulates the flow for demo purposes.
              </p>
            )}
          </div>

          {serverError && (
            <div className="rounded-[var(--radius-control)] bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Requesting…" : "Request booking"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
