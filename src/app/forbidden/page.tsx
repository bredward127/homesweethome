import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/layout";
import { SignOutButton } from "@/components/app/sign-out-button";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { siteConfig } from "@/config/site";

/** Reflects the signed-in user, so it must never be prerendered or cached. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Access Denied",
  robots: { index: false, follow: false },
};

/**
 * Shown when a signed-in user reaches something their role does not cover, or
 * when an account exists but has not been granted a role yet. Says what to do
 * next without disclosing anything about the resource they tried to reach.
 */
export default async function ForbiddenPage() {
  const user = await getCurrentUser();
  const hasNoRoles = Boolean(user) && user?.roles.length === 0;

  return (
    <main id="main" className="flex min-h-dvh items-center justify-center bg-cream-100 px-4 py-12">
      <Container size="narrow" className="max-w-lg">
        <Card>
          <CardContent className="flex flex-col items-start gap-4">
            <span className="flex size-12 items-center justify-center rounded-full bg-warn-50 text-warn-700">
              <ShieldAlert className="size-6" aria-hidden="true" />
            </span>

            <h1 className="text-2xl font-semibold tracking-tight">
              {hasNoRoles ? "Your account is not set up yet" : "You do not have access to that"}
            </h1>

            <p className="leading-relaxed text-ink-600">
              {hasNoRoles
                ? `You are signed in, but no role has been assigned to your account yet. An administrator needs to grant you one before you can use the ${siteConfig.name} workspace.`
                : "Your account does not have permission for that area. If you think it should, ask an administrator to review your role."}
            </p>

            {user ? (
              <p className="text-sm text-ink-500">
                Signed in as {user.email}
                {user.roles.length > 0
                  ? ` · ${user.roles.map((role) => ROLE_LABELS[role]).join(", ")}`
                  : " · no role assigned"}
              </p>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-3">
              {user && !hasNoRoles ? (
                <ButtonLink href="/app/dashboard">Back to dashboard</ButtonLink>
              ) : (
                <ButtonLink href="/">Back to site</ButtonLink>
              )}
              {user ? <SignOutButton variant="secondary" /> : null}
            </div>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
