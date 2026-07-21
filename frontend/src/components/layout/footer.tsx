import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <span className="font-display text-lg font-semibold text-foreground">
              Serv<span className="text-accent">io</span>
            </span>
            <p className="mt-2 max-w-xs text-sm text-muted">
              Find trusted, verified local professionals for the work that keeps
              your home and life running.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <p className="font-medium text-foreground">Explore</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li><Link href="/search" className="hover:text-primary">Find a professional</Link></li>
                <li><Link href="/how-it-works" className="hover:text-primary">How it works</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">Providers</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li><Link href="/register" className="hover:text-primary">Join as a provider</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-muted">
          © {new Date().getFullYear()} Servio. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
