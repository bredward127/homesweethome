import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset Your Password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle as="h1" className="text-2xl">
          Reset your password
        </CardTitle>
        <CardDescription>
          Enter your work email and we will send you a link to set a new password.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-2">
        <ForgotPasswordForm />
        <p className="text-center text-sm text-ink-600">
          <Link href="/login" className="font-semibold text-sage-700 underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
