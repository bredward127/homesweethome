import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isRole, hasPermission, hasAnyPermission, type Permission, type Role } from "@/lib/auth/roles";

/** The signed-in staff member, as every server component sees them. */
export type CurrentUser = {
  id: string;
  email: string;
  fullName: string | null;
  jobTitle: string | null;
  isActive: boolean;
  roles: Role[];
};

/**
 * Load the current user and their roles.
 *
 * `cache` dedupes this across a single render pass, so a layout and the page
 * beneath it share one round trip.
 *
 * Uses `getUser()`, not `getSession()`: getUser revalidates the JWT against
 * the Supabase auth server, so a forged or stale cookie cannot manufacture a
 * session.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, job_title, is_active, archived_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  // A deactivated or archived profile is treated as no session at all.
  if (!profile || !profile.is_active || profile.archived_at) return null;

  const roles = (roleRows ?? [])
    .map((row) => row.role)
    .filter((role): role is Role => isRole(role));

  return {
    id: profile.id,
    email: profile.email ?? user.email ?? "",
    fullName: profile.full_name,
    jobTitle: profile.job_title,
    isActive: profile.is_active,
    roles,
  };
});

/**
 * Require a signed-in user with at least one role, or redirect to the login
 * page with a return path. Use this at the top of every protected layout,
 * page, and server action — the edge proxy alone is not an authorization boundary.
 */
export async function requireUser(returnTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const target = returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login";
    redirect(target);
  }
  // Authenticated but not yet granted any role: no CRM access.
  if (user.roles.length === 0) redirect("/forbidden");
  return user;
}

/** Require a specific permission, or send the user to the Forbidden page. */
export async function requirePermission(
  permission: Permission,
  returnTo?: string,
): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (!hasPermission(user.roles, permission)) redirect("/forbidden");
  return user;
}

/** Require at least one of several permissions. */
export async function requireAnyPermission(
  permissions: readonly Permission[],
  returnTo?: string,
): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (!hasAnyPermission(user.roles, permissions)) redirect("/forbidden");
  return user;
}

/**
 * Non-redirecting permission check for server actions, which should return a
 * typed error rather than throwing a redirect mid-mutation.
 */
export async function authorize(
  permission: Permission,
): Promise<{ ok: true; user: CurrentUser } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You need to sign in to do that." };
  if (!hasPermission(user.roles, permission)) {
    return { ok: false, error: "You do not have permission to do that." };
  }
  return { ok: true, user };
}
