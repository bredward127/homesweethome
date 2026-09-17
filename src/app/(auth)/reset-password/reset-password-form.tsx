"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { updatePasswordAction, type AuthFormState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" block size="lg" disabled={pending}>
      {pending ? "Saving…" : "Save new password"}
    </Button>
  );
}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(updatePasswordAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state?.error ? (
        <Alert tone="danger" live>
          {state.error}
        </Alert>
      ) : null}

      <Field label="New password" required error={state?.fieldErrors?.password}>
        <Input name="password" type="password" autoComplete="new-password" required />
      </Field>

      <Field label="Confirm new password" required error={state?.fieldErrors?.confirmPassword}>
        <Input name="confirmPassword" type="password" autoComplete="new-password" required />
      </Field>

      <SubmitButton />
    </form>
  );
}
