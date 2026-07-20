import { describe, it, expect } from "vitest";
import {
  saveSession,
  clearSession,
  getToken,
  getRole,
  isAuthenticated,
  dashboardPathForRole,
} from "@/lib/auth";

describe("saveSession / clearSession / getToken / getRole", () => {
  it("has no token or role before login", () => {
    expect(getToken()).toBeNull();
    expect(getRole()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it("persists the token and role after saveSession", () => {
    saveSession("abc.def.ghi", "PROVIDER");
    expect(getToken()).toBe("abc.def.ghi");
    expect(getRole()).toBe("PROVIDER");
    expect(isAuthenticated()).toBe(true);
  });

  it("clears both token and role on clearSession", () => {
    saveSession("abc.def.ghi", "CUSTOMER");
    clearSession();
    expect(getToken()).toBeNull();
    expect(getRole()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });
});

describe("dashboardPathForRole", () => {
  it("routes providers to their dashboard", () => {
    expect(dashboardPathForRole("PROVIDER")).toBe("/dashboard/provider");
  });

  it("routes admins to their dashboard", () => {
    expect(dashboardPathForRole("ADMIN")).toBe("/dashboard/admin");
  });

  it("routes customers (and null) to the default dashboard", () => {
    expect(dashboardPathForRole("CUSTOMER")).toBe("/dashboard");
    expect(dashboardPathForRole(null)).toBe("/dashboard");
  });
});
