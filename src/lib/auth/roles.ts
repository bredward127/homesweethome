/**
 * Role and permission model for the internal CRM.
 *
 * This module is the single source of truth for what each role may do in the
 * UI. It is deliberately dependency-free so it can be unit tested and imported
 * from both server and client code.
 *
 * IMPORTANT: this is a *convenience* layer for rendering. It is never the only
 * thing standing between a user and a record — every privileged read and write
 * is additionally enforced by Postgres Row Level Security (see
 * supabase/migrations) and re-checked server-side before mutating.
 */

export const ROLES = [
  "admin",
  "acquisition_manager",
  "closing_specialist",
  "disposition_manager",
  "analyst",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  acquisition_manager: "Acquisition Manager",
  closing_specialist: "Closing Specialist",
  disposition_manager: "Disposition Manager",
  analyst: "Analyst (read-only)",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin:
    "Full access to settings, team management, reporting, scoring rules, templates, and the audit log.",
  acquisition_manager:
    "Works leads, properties, offers, appointments, and contracts. No team or security settings.",
  closing_specialist:
    "Works assigned leads, appointments, tasks, and the contracts they are responsible for.",
  disposition_manager:
    "Works contracted properties, the buyer database, and the disposition pipeline.",
  analyst: "Reads dashboards and permitted records. Cannot create, edit, or delete.",
};

/**
 * Granular permissions, named `<resource>:<action>` so they stay readable and
 * map closely to the RLS policies backing them.
 */
export const PERMISSIONS = [
  "leads:read",
  "leads:read_all",
  "leads:write",
  "leads:assign",
  "leads:archive",
  "leads:notes_internal",
  "properties:read",
  "properties:write",
  "contacts:read",
  "contacts:write",
  "tasks:read",
  "tasks:write",
  "appointments:read",
  "appointments:write",
  "offers:read",
  "offers:write",
  "contracts:read",
  "contracts:write",
  "documents:read",
  "documents:write",
  "dispositions:read",
  "dispositions:write",
  "buyers:read",
  "buyers:write",
  "reports:read",
  "reports:export",
  "settings:read",
  "settings:write",
  "team:read",
  "team:write",
  "scoring:write",
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ACQUISITION: Permission[] = [
  "leads:read",
  "leads:read_all",
  "leads:write",
  "leads:assign",
  "leads:archive",
  "leads:notes_internal",
  "properties:read",
  "properties:write",
  "contacts:read",
  "contacts:write",
  "tasks:read",
  "tasks:write",
  "appointments:read",
  "appointments:write",
  "offers:read",
  "offers:write",
  "contracts:read",
  "contracts:write",
  "documents:read",
  "documents:write",
  "dispositions:read",
  "buyers:read",
  "reports:read",
  "settings:read",
];

const CLOSING: Permission[] = [
  "leads:read",
  "leads:write",
  "leads:notes_internal",
  "properties:read",
  "contacts:read",
  "contacts:write",
  "tasks:read",
  "tasks:write",
  "appointments:read",
  "appointments:write",
  "offers:read",
  "offers:write",
  "contracts:read",
  "contracts:write",
  "documents:read",
  "documents:write",
  "reports:read",
  "settings:read",
];

const DISPOSITION: Permission[] = [
  "leads:read",
  "properties:read",
  "contacts:read",
  "contacts:write",
  "tasks:read",
  "tasks:write",
  "contracts:read",
  "documents:read",
  "documents:write",
  "dispositions:read",
  "dispositions:write",
  "buyers:read",
  "buyers:write",
  "reports:read",
  "settings:read",
];

const ANALYST: Permission[] = [
  "leads:read",
  "leads:read_all",
  "properties:read",
  "contacts:read",
  "tasks:read",
  "appointments:read",
  "offers:read",
  "contracts:read",
  "dispositions:read",
  "buyers:read",
  "reports:read",
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: PERMISSIONS,
  acquisition_manager: ACQUISITION,
  closing_specialist: CLOSING,
  disposition_manager: DISPOSITION,
  analyst: ANALYST,
};

/** Whether a role grants a permission. */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Whether any of a user's roles grants a permission. */
export function hasPermission(
  roles: readonly Role[] | null | undefined,
  permission: Permission,
): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.some((role) => roleHasPermission(role, permission));
}

/** Whether any of a user's roles grants *every* listed permission. */
export function hasAllPermissions(
  roles: readonly Role[] | null | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(roles, permission));
}

/** Whether any of a user's roles grants *at least one* listed permission. */
export function hasAnyPermission(
  roles: readonly Role[] | null | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(roles, permission));
}

/** Narrowing guard for values arriving from the database or a form. */
export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * A closing specialist only sees the leads assigned to them; every other role
 * with `leads:read` sees the full pipeline. Mirrors the `leads` RLS policy.
 */
export function canReadAllLeads(roles: readonly Role[] | null | undefined): boolean {
  return hasPermission(roles, "leads:read_all");
}
