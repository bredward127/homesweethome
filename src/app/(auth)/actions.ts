"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/auth/audit";
import { publicEnv } from "@/lib/env";
import {
  forgotPasswordSchema,
  newPasswordSchema,
  safeReturnPath,
  signInSchema,
} from "@/lib/validation/auth";

/** Shape returned to every auth form. `null` means "nothing submitted yet". */
export type AuthFormState = {
  error?: string;
  /** Per-field messages keyed by input name. */
  fieldErrors?: Record<string, string>;
  success?: string;
} | null;

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

const SUPABASE_UNCONFIGURED =
  "Sign-in is unavailable because Supabase is not configured for this environment. See README.md.";

export async function signInAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  if (!supabase) return { error: SUPABASE_UNCONFIGURED };

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    // Deliberately generic: never reveal whether the address has an account.
    await recordAudit({
      action: "sign_in_failed",
      actorEmail: parsed.data.email,
      summary: "Failed sign-in attempt",
    });
    return { error: "That email address and password combination did not work." };
  }

  await recordAudit({
    action: "sign_in",
    actorId: data.user.id,
    actorEmail: data.user.email ?? parsed.data.email,
    summary: "Signed in",
  });

  // Best effort: a failed timestamp update must not block sign-in.
  await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", data.user.id);

  revalidatePath("/app", "layout");
  redirect(safeReturnPath(parsed.data.next));
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.auth.signOut();
    if (user) {
      await recordAudit({
        action: "sign_out",
        actorId: user.id,
        actorEmail: user.email ?? null,
        summary: "Signed out",
      });
    }
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordResetAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  // Always the same response, whether or not the account exists, so this
  // endpoint cannot be used to enumerate team members.
  const genericSuccess = {
    success:
      "If that address belongs to a team member, a password reset link is on its way. Check your inbox and spam folder.",
  };

  const supabase = await createClient();
  if (!supabase) return { error: SUPABASE_UNCONFIGURED };

  const headerList = await headers();
  const origin = headerList.get("origin") ?? publicEnv.appUrl;

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password`,
  });
  if (error) console.error("[auth] password reset request failed:", error.message);

  await recordAudit({
    action: "password_reset_requested",
    actorEmail: parsed.data.email,
    summary: "Password reset requested",
  });

  return genericSuccess;
}

export async function updatePasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  if (!supabase) return { error: SUPABASE_UNCONFIGURED };

  // The recovery link established a session; without one there is nothing to
  // update, and we must not let an anonymous caller set anybody's password.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error:
        "This reset link is no longer valid. Request a new one from the forgot password page.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  await recordAudit({
    action: "record_updated",
    actorId: user.id,
    actorEmail: user.email ?? null,
    entityType: "auth.user",
    entityId: user.id,
    summary: "Password changed via reset link",
  });

  revalidatePath("/app", "layout");
  redirect("/app/dashboard");
}
