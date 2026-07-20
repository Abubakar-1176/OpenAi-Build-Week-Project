export type UserRole = "CUSTOMER" | "PROVIDER" | "ADMIN";

const TOKEN_KEY = "locallink_token";
const ROLE_KEY = "locallink_role";
const AUTH_CHANGE_EVENT = "locallink-auth-change";

function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

export function saveSession(token: string, role: UserRole) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(ROLE_KEY, role);
  notifyAuthChange();
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ROLE_KEY);
  notifyAuthChange();
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ROLE_KEY) as UserRole | null;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function dashboardPathForRole(role: UserRole | null): string {
  switch (role) {
    case "PROVIDER":
      return "/dashboard/provider";
    case "ADMIN":
      return "/dashboard/admin";
    default:
      return "/dashboard";
  }
}

/**
 * Subscribe to auth state changes - fires on same-tab login/logout (via the
 * custom event dispatched above) and on cross-tab changes (native "storage"
 * event). Designed for useSyncExternalStore, which is the correct way to
 * read external mutable state like localStorage in a React component
 * without calling setState inside an effect.
 */
export function subscribeToAuthChanges(callback: () => void): () => void {
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
