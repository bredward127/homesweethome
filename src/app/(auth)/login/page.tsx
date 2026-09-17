import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { isSupabaseConfigured } from "@/lib/env";
import { safeReturnPath } from "@/lib/validation/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Team Sign In",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  // Validated here so a crafted ?next= cannot bounce a signed-in user off-site.
  const next = safeReturnPath(params.next);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle as="h1" className="text-2xl">
          Team sign in
        </CardTitle>
        <CardDescription>
          This area is for {`Home Sweet Home`} staff. Homeowner information lives here, so access
          is restricted and every sign-in is logged.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-2">
        {!isSupabaseConfigured ? (
          <Alert tone="warn" title="Supabase is not configured">
            Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable sign-in. See
            the README for setup steps.
          </Alert>
        ) : null}
        <LoginForm next={next} />
      </CardContent>
    </Card>
  );
}
