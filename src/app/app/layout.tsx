import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { requireUser } from "@/lib/auth/session";

/**
 * Internal workspace layout.
 *
 * `requireUser()` runs on every request to every /app route. Middleware
 * already turned away unauthenticated requests, but this is the check that
 * actually matters: the edge proxy can be bypassed by anything that does not go
 * through it, and it cannot see role assignments.
 */
export const metadata: Metadata = {
  title: { default: "Workspace", template: "%s — Home Sweet Home Workspace" },
  robots: { index: false, follow: false, nocache: true },
};

/** Sessions are per-request; never serve a cached shell for a signed-in user. */
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/app/dashboard");

  return (
    <AppShell user={{ email: user.email, fullName: user.fullName, roles: user.roles }}>
      {children}
    </AppShell>
  );
}
