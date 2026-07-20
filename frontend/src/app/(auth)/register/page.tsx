"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { Wrench, User } from "lucide-react";

import { api } from "@/lib/api";
import { saveSession, dashboardPathForRole, type UserRole } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const registerSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["CUSTOMER", "PROVIDER"]),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [role, setRole] = useState<"CUSTOMER" | "PROVIDER">("CUSTOMER");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "CUSTOMER" },
  });

  const chooseRole = (value: "CUSTOMER" | "PROVIDER") => {
    setRole(value);
    setValue("role", value);
  };

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    try {
      await api.post("/auth/register", data);
      const loginResp = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });
      const { access_token, user_role } = loginResp.data as {
        access_token: string;
        user_role: UserRole;
      };
      saveSession(access_token, user_role);
      router.push(dashboardPathForRole(user_role));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setServerError(String(err.response.data.detail));
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Join LocalLink as a customer or a service provider.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => chooseRole("CUSTOMER")}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-[var(--radius-control)] border px-4 py-3 text-sm font-medium transition-colors",
                role === "CUSTOMER"
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border text-muted hover:border-primary/50"
              )}
            >
              <User className="h-5 w-5" />
              I need a service
            </button>
            <button
              type="button"
              onClick={() => chooseRole("PROVIDER")}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-[var(--radius-control)] border px-4 py-3 text-sm font-medium transition-colors",
                role === "PROVIDER"
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border text-muted hover:border-primary/50"
              )}
            >
              <Wrench className="h-5 w-5" />
              I provide a service
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <input type="hidden" {...register("role")} value={role} />

            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Ali Khan" error={!!errors.name} {...register("name")} />
              {errors.name && <p className="mt-1.5 text-xs text-danger">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                error={!!errors.email}
                {...register("email")}
              />
              {errors.email && <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" placeholder="03001234567" {...register("phone")} />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                error={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-[var(--radius-control)] bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
