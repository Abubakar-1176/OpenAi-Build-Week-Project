"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthState } from "@/lib/use-auth";
import type { UserRole } from "@/lib/auth";

/**
 * Wrap a protected page's content with this. Redirects to /login if not
 * authenticated, or to /unauthorized if authenticated with the wrong role.
 * Renders nothing until the auth check resolves, avoiding a flash of
 * protected content.
 */
export function RequireRole({
  allow,
  children,
}: {
  allow: UserRole[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { authed, role } = useAuthState();

  useEffect(() => {
    if (!authed) {
      router.replace("/login");
      return;
    }
    if (role && !allow.includes(role)) {
      router.replace("/unauthorized");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, role]);

  if (!authed || (role && !allow.includes(role))) {
    return null;
  }

  return <>{children}</>;
}
