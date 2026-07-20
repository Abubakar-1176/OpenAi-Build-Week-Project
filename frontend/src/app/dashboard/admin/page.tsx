"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Users, Wrench, CalendarCheck, Star, ShieldCheck, Trash2, Plus } from "lucide-react";

import { api } from "@/lib/api";
import { RequireRole } from "@/components/auth/require-role";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import type { Category, Provider } from "@/types";

interface DashboardStats {
  total_users: number;
  total_customers: number;
  total_providers: number;
  verified_providers: number;
  unverified_providers: number;
  total_bookings: number;
  total_reviews: number;
}

function AdminDashboardInner() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [statsResp, providersResp, categoriesResp] = await Promise.all([
      api.get<DashboardStats>("/admin/dashboard"),
      api.get<Provider[]>("/providers"),
      api.get<Category[]>("/categories"),
    ]);
    setStats(statsResp.data);
    setProviders(providersResp.data);
    setCategories(categoriesResp.data);
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

  const verifyProvider = async (id: number) => {
    setBusyId(id);
    try {
      await api.put(`/providers/${id}/verify`);
      setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, verified: true } : p)));
    } finally {
      setBusyId(null);
    }
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setCategoryError(null);
    setBusyId("new-category");
    try {
      const resp = await api.post<Category>("/categories", { name: newCategory.trim() });
      setCategories((prev) => [...prev, resp.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategory("");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setCategoryError(String(err.response.data.detail));
      } else {
        setCategoryError("Couldn't add that category.");
      }
    } finally {
      setBusyId(null);
    }
  };

  const deleteCategory = async (id: number) => {
    setBusyId(id);
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setCategoryError(String(err.response.data.detail));
      }
    } finally {
      setBusyId(null);
    }
  };

  if (loading || !stats) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-24 animate-pulse bg-black/[0.03]" />
          ))}
        </div>
      </div>
    );
  }

  const unverified = providers.filter((p) => !p.verified);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-medium text-foreground">Admin dashboard</h1>

      {/* Platform stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Users className="h-3.5 w-3.5" /> Total users
          </div>
          <div className="mt-1 font-tabular text-2xl font-medium text-foreground">{stats.total_users}</div>
          <div className="mt-0.5 text-xs text-muted">
            {stats.total_customers} customers · {stats.total_providers} providers
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Wrench className="h-3.5 w-3.5" /> Providers
          </div>
          <div className="mt-1 font-tabular text-2xl font-medium text-foreground">
            {stats.verified_providers}/{stats.verified_providers + stats.unverified_providers}
          </div>
          <div className="mt-0.5 text-xs text-muted">verified</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <CalendarCheck className="h-3.5 w-3.5" /> Bookings
          </div>
          <div className="mt-1 font-tabular text-2xl font-medium text-foreground">{stats.total_bookings}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Star className="h-3.5 w-3.5" /> Reviews
          </div>
          <div className="mt-1 font-tabular text-2xl font-medium text-foreground">{stats.total_reviews}</div>
        </Card>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Provider verification */}
        <div>
          <h2 className="font-display text-lg font-medium text-foreground">
            Provider verification {unverified.length > 0 && <Badge tone="accent">{unverified.length} pending</Badge>}
          </h2>
          <div className="mt-3 space-y-2">
            {unverified.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted">All providers are verified.</Card>
            ) : (
              unverified.map((p) => (
                <Card key={p.id} className="flex items-center justify-between p-3.5">
                  <div>
                    <div className="text-sm font-medium text-foreground">{p.provider_name}</div>
                    <div className="text-xs text-muted">{p.category.name}</div>
                  </div>
                  <Button size="sm" onClick={() => verifyProvider(p.id)} disabled={busyId === p.id}>
                    <ShieldCheck className="h-4 w-4" />
                    {busyId === p.id ? "Verifying…" : "Verify"}
                  </Button>
                </Card>
              ))
            )}

            {providers.filter((p) => p.verified).length > 0 && (
              <div className="pt-2">
                <div className="text-xs font-medium text-muted">Verified</div>
                <div className="mt-2 space-y-2">
                  {providers
                    .filter((p) => p.verified)
                    .map((p) => (
                      <Card key={p.id} className="flex items-center gap-2 p-3">
                        <VerifiedBadge size="sm" />
                        <span className="text-sm text-foreground">{p.provider_name}</span>
                        <span className="text-xs text-muted">— {p.category.name}</span>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category management */}
        <div>
          <h2 className="font-display text-lg font-medium text-foreground">Categories</h2>
          <form onSubmit={addCategory} className="mt-3 flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name"
            />
            <Button type="submit" disabled={busyId === "new-category"}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </form>
          {categoryError && <p className="mt-2 text-xs text-danger">{categoryError}</p>}

          <div className="mt-3 space-y-1.5">
            {categories.map((c) => (
              <Card key={c.id} className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-sm text-foreground">{c.name}</span>
                <button
                  onClick={() => deleteCategory(c.id)}
                  disabled={busyId === c.id}
                  className="text-muted hover:text-danger"
                  aria-label={`Delete ${c.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <RequireRole allow={["ADMIN"]}>
      <AdminDashboardInner />
    </RequireRole>
  );
}
