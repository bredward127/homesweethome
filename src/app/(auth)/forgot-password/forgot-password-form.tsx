"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { requestPasswordResetAction, type AuthFormState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" block size="lg" disabled={pending}>
      {pending ? "Sending…" : "Send reset link"}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    requestPasswordResetAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state?.error ? (
        <Alert tone="danger" live>
          {state.error}
        </Alert>
      ) : null}
      {state?.success ? (
        <Alert tone="sage" live>
          {state.success}
        </Alert>
      ) : null}

      <Field label="Work email" required error={state?.fieldErrors?.email}>
        <Input
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </Field>

      <SubmitButton />
    </form>
  );
}
