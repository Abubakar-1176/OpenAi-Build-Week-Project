"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { clearSession, dashboardPathForRole } from "@/lib/auth";
import { useAuthState } from "@/lib/use-auth";

export function Navbar() {
  const router = useRouter();
  const { authed, role } = useAuthState();

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-display text-xl font-semibold text-foreground">
          Serv<span className="text-accent">io</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-foreground/80 md:flex">
          <Link href="/search" className="hover:text-primary transition-colors">
            Find a professional
          </Link>
          <Link href="/how-it-works" className="hover:text-primary transition-colors">
            How it works
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {authed ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={dashboardPathForRole(role)}>Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild variant="primary" size="sm">
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
