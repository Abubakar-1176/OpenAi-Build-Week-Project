import Link from "next/link";
import {
  Zap,
  Wrench as WrenchIcon,
  Car,
  GraduationCap,
  Sparkles,
  Search,
  ShieldCheck,
  CalendarCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { api } from "@/lib/api";
import type { Category, Provider } from "@/types";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Electrician: Zap,
  Plumber: WrenchIcon,
  Mechanic: Car,
  Tutor: GraduationCap,
  Cleaner: Sparkles,
};

async function getCategories(): Promise<Category[]> {
  try {
    const resp = await api.get("/categories");
    return resp.data;
  } catch {
    return [];
  }
}

async function getFeaturedProviders(): Promise<Provider[]> {
  try {
    const resp = await api.get("/providers");
    return (resp.data as Provider[]).slice(0, 3);
  } catch {
    return [];
  }
}

export default async function Home() {
  const [categories, providers] = await Promise.all([getCategories(), getFeaturedProviders()]);

  return (
    <div>
      {/* Hero — the search bar is the thesis: this is a tool for finding someone, not a brochure */}
      <section className="border-b border-border bg-gradient-to-b from-primary-soft/60 to-paper">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h1 className="font-display text-4xl font-medium leading-tight text-foreground sm:text-5xl">
            Find a local professional you can{" "}
            <span className="italic text-primary">actually</span> trust
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            Verified electricians, plumbers, mechanics, tutors, and cleaners —
            booked in minutes, backed by real reviews.
          </p>

          <form
            action="/search"
            className="mx-auto mt-8 flex max-w-xl flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-card p-2 shadow-sm sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                name="q"
                placeholder="What service do you need?"
                className="h-12 border-0 pl-10 shadow-none focus-visible:ring-0"
              />
            </div>
            <Button type="submit" size="lg" className="sm:w-auto">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Popular categories */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-medium text-foreground">Popular categories</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {(categories.length > 0
            ? categories
            : [
                { id: 1, name: "Electrician" },
                { id: 2, name: "Plumber" },
                { id: 3, name: "Mechanic" },
                { id: 4, name: "Tutor" },
                { id: 5, name: "Cleaner" },
              ]
          ).map((cat) => {
            const Icon = CATEGORY_ICONS[cat.name] ?? Sparkles;
            return (
              <Link key={cat.id} href={`/search?category_id=${cat.id}`}>
                <Card className="flex flex-col items-center gap-3 px-4 py-6 text-center transition-transform hover:-translate-y-0.5 hover:shadow-md">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{cat.name}</span>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured providers */}
      <section className="border-y border-border bg-white/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-medium text-foreground">Featured providers</h2>

          {providers.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {providers.map((p) => (
                <Link key={p.id} href={`/providers/${p.id}`}>
                  <Card className="h-full p-5 transition-transform hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft font-display text-lg font-medium text-primary">
                        {(p.provider_name ?? "?").charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">{p.provider_name}</span>
                          {p.verified && <VerifiedBadge size="sm" />}
                        </div>
                        <span className="text-xs text-muted">{p.category.name}</span>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-muted">{p.description}</p>
                    <div className="mt-4 flex items-center justify-between font-tabular text-sm">
                      <span className="text-foreground">
                        {p.hourly_rate ? `Rs. ${p.hourly_rate}/hr` : "Rate on request"}
                      </span>
                      <span className="text-accent">★ {p.average_rating.toFixed(1)}</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="mt-6 p-10 text-center">
              <p className="text-muted">
                No providers yet — be the first to{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  join as a provider
                </Link>
                .
              </p>
            </Card>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-medium text-foreground">How it works</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {[
            { icon: Search, title: "Search & compare", body: "Browse verified providers by category, price, and rating near you." },
            { icon: CalendarCheck, title: "Book a slot", body: "Pick a time that works from their live availability and confirm." },
            { icon: ShieldCheck, title: "Get it done", body: "Your provider completes the job — then you leave a review." },
          ].map((step, i) => (
            <div key={step.title} className="flex flex-col items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
                <step.icon className="h-5 w-5" />
              </span>
              <span className="font-tabular text-xs text-muted">Step {i + 1}</span>
              <h3 className="font-display text-lg font-medium text-foreground">{step.title}</h3>
              <p className="text-sm text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border bg-white/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-medium text-foreground">What customers say</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {[
              { name: "Bilal A.", quote: "Found an electrician within an hour and the whole booking took two minutes." },
              { name: "Sara M.", quote: "Loved being able to see reviews before booking a tutor for my daughter." },
              { name: "Hamza K.", quote: "The verified badge actually means something here — no surprises on the day." },
            ].map((t) => (
              <Card key={t.name} className="p-5">
                <p className="font-display text-lg italic text-foreground">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-3 text-sm font-medium text-muted">{t.name}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
