"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";

import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProviderCard } from "@/components/providers/provider-card";
import type { Category, Provider } from "@/types";

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState(searchParams.get("category_id") ?? "");
  const [minRating, setMinRating] = useState(searchParams.get("min_rating") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data)).catch(() => setCategories([]));
  }, []);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (categoryId) params.category_id = categoryId;
      if (minRating) params.min_rating = minRating;
      if (maxPrice) params.max_price = maxPrice;

      const resp = await api.get<Provider[]>("/providers", { params });
      let results = resp.data;

      // Client-side text match on name/description - the API doesn't have a
      // free-text search param, so we filter the (already-filtered) results.
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        results = results.filter(
          (p) =>
            p.provider_name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.category.name.toLowerCase().includes(q)
        );
      }

      setProviders(results);
    } catch {
      setError("Couldn't load providers right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [categoryId, minRating, maxPrice, query]);

  useEffect(() => {
    // Initial data fetch on mount - this function is also reused for
    // user-triggered refreshes, so the loading state can't be seeded via
    // useState's initial value instead. Fetching external data in an
    // effect is the pattern React's own docs recommend here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (categoryId) params.set("category_id", categoryId);
    if (minRating) params.set("min_rating", minRating);
    if (maxPrice) params.set("max_price", maxPrice);
    if (query) params.set("q", query);
    router.replace(`/search?${params.toString()}`);
    runSearch();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-medium text-foreground">Find a professional</h1>
      <p className="mt-1 text-muted">Filter by category, price, and rating to find the right fit.</p>

      <form
        onSubmit={applyFilters}
        className="mt-6 grid grid-cols-1 gap-3 rounded-[var(--radius-card)] border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-end"
      >
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Search</label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, category, keyword…"
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Category</label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Min rating</label>
          <Select value={minRating} onChange={(e) => setMinRating(e.target.value)}>
            <option value="">Any</option>
            <option value="4">4+ stars</option>
            <option value="3">3+ stars</option>
            <option value="2">2+ stars</option>
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Max price</label>
          <Input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Rs./hr"
          />
        </div>

        <Button type="submit" className="sm:w-auto">
          <SlidersHorizontal className="h-4 w-4" />
          Apply
        </Button>
      </form>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-40 animate-pulse bg-black/[0.03]" />
            ))}
          </div>
        ) : error ? (
          <Card className="p-10 text-center text-danger">{error}</Card>
        ) : providers.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-muted">No providers match those filters. Try widening your search.</p>
          </Card>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted">
              {providers.length} provider{providers.length === 1 ? "" : "s"} found
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {providers.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}
