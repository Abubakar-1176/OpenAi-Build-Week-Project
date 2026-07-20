"use client";

import { useSyncExternalStore } from "react";

import { getRole, isAuthenticated, subscribeToAuthChanges, type UserRole } from "@/lib/auth";

function getAuthedSnapshot() {
  return isAuthenticated();
}

function getAuthedServerSnapshot() {
  return false;
}

/**
 * Reads auth state from localStorage via useSyncExternalStore - the correct
 * way to subscribe to an external mutable source in React, rather than
 * mirroring it into component state inside a useEffect.
 */
export function useAuthState(): { authed: boolean; role: UserRole | null } {
  const authed = useSyncExternalStore(
    subscribeToAuthChanges,
    getAuthedSnapshot,
    getAuthedServerSnapshot
  );
  const role = authed ? getRole() : null;
  return { authed, role };
}
