import { describe, expect, it } from "vitest";
import {
  ROLES,
  ROLE_PERMISSIONS,
  canReadAllLeads,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isRole,
  roleHasPermission,
  type Role,
} from "@/lib/auth/roles";

describe("role model", () => {
  it("defines permissions for every role", () => {
    for (const role of ROLES) {
      expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
    }
  });

  it("gives admin every permission", () => {
    expect(roleHasPermission("admin", "settings:write")).toBe(true);
    expect(roleHasPermission("admin", "audit:read")).toBe(true);
    expect(roleHasPermission("admin", "team:write")).toBe(true);
  });

  it("denies non-admins the security-sensitive permissions", () => {
    const sensitive = ["settings:write", "team:write", "scoring:write", "audit:read"] as const;
    const nonAdmins = ROLES.filter((role) => role !== "admin");

    for (const role of nonAdmins) {
      for (const permission of sensitive) {
        expect(
          roleHasPermission(role, permission),
          `${role} must not hold ${permission}`,
        ).toBe(false);
      }
    }
  });

  it("makes the analyst strictly read-only", () => {
    const writes = ROLE_PERMISSIONS.analyst.filter(
      (permission) => !permission.endsWith(":read") && !permission.endsWith(":read_all"),
    );
    expect(writes).toEqual([]);
  });

  it("does not let a disposition manager edit leads", () => {
    expect(roleHasPermission("disposition_manager", "leads:read")).toBe(true);
    expect(roleHasPermission("disposition_manager", "leads:write")).toBe(false);
    expect(roleHasPermission("disposition_manager", "leads:assign")).toBe(false);
  });

  it("does not let an acquisition manager change the buyer database", () => {
    expect(roleHasPermission("acquisition_manager", "buyers:read")).toBe(true);
    expect(roleHasPermission("acquisition_manager", "buyers:write")).toBe(false);
  });

  it("restricts a closing specialist to their assigned leads", () => {
    expect(canReadAllLeads(["closing_specialist"])).toBe(false);
    expect(canReadAllLeads(["acquisition_manager"])).toBe(true);
    expect(canReadAllLeads(["admin"])).toBe(true);
    expect(canReadAllLeads(["analyst"])).toBe(true);
  });
});

describe("permission checks", () => {
  it("treats a user with no roles as having nothing", () => {
    expect(hasPermission([], "leads:read")).toBe(false);
    expect(hasPermission(null, "leads:read")).toBe(false);
    expect(hasPermission(undefined, "leads:read")).toBe(false);
    expect(hasAnyPermission([], ["leads:read", "reports:read"])).toBe(false);
  });

  it("unions permissions across multiple roles", () => {
    const roles: Role[] = ["closing_specialist", "disposition_manager"];
    // Neither role alone can write buyers *and* write offers.
    expect(hasPermission(roles, "buyers:write")).toBe(true);
    expect(hasPermission(roles, "offers:write")).toBe(true);
    // The union still stops short of admin-only permissions.
    expect(hasPermission(roles, "team:write")).toBe(false);
  });

  it("requires every permission for hasAllPermissions", () => {
    expect(hasAllPermissions(["analyst"], ["leads:read", "reports:read"])).toBe(true);
    expect(hasAllPermissions(["analyst"], ["leads:read", "leads:write"])).toBe(false);
  });
});

describe("isRole", () => {
  it("accepts known roles and rejects anything else", () => {
    expect(isRole("admin")).toBe(true);
    expect(isRole("superuser")).toBe(false);
    expect(isRole("")).toBe(false);
    expect(isRole(null)).toBe(false);
    expect(isRole(42)).toBe(false);
  });
});
