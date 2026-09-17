"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { signOutAction } from "@/app/(auth)/actions";

function SubmitButton({ variant = "ghost", size = "sm", block }: Partial<ButtonProps>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} block={block} disabled={pending}>
      <LogOut aria-hidden="true" />
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}

/** Sign-out is a POST via a form action, so it cannot be triggered by a link. */
export function SignOutButton(props: Partial<ButtonProps>) {
  return (
    <form action={signOutAction}>
      <SubmitButton {...props} />
    </form>
  );
}
