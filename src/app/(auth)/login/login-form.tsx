"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { signInAction, type AuthFormState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" block size="lg" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(signInAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state?.error ? (
        <Alert tone="danger" live>
          {state.error}
        </Alert>
      ) : null}

      <input type="hidden" name="next" value={next ?? ""} />

      <Field label="Work email" required error={state?.fieldErrors?.email}>
        <Input
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="you@homesweethome.example"
        />
      </Field>

      <Field label="Password" required error={state?.fieldErrors?.password}>
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>

      <SubmitButton />

      <p className="text-center text-sm text-ink-600">
        <Link
          href="/forgot-password"
          className="font-semibold text-sage-700 underline underline-offset-4"
        >
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}
