import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Choose a New Password",
  robots: { index: false, follow: false },
};

/**
 * Reached from the emailed recovery link. Supabase establishes a short-lived
 * recovery session from the link fragment before this form is submitted; the
 * server action re-checks that session before changing anything.
 */
export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle as="h1" className="text-2xl">
          Choose a new password
        </CardTitle>
        <CardDescription>
          Use at least 12 characters, with an uppercase letter, a lowercase letter, and a number.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-2">
        <ResetPasswordForm />
        <p className="text-center text-sm text-ink-600">
          <Link href="/login" className="font-semibold text-sage-700 underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
