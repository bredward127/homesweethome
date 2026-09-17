import { z } from "zod";

/**
 * Auth input schemas. Shared by the client form and the server action, so the
 * browser and the server agree on what is valid — and the server never trusts
 * that the client checked.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(254, "That email address is too long.")
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

/**
 * Sign-in deliberately checks only that a password was typed. Enforcing
 * complexity here would leak the password policy to anyone probing the login
 * form; strength is enforced when a password is set.
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
  /** Relative path to return to after signing in. */
  next: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, "Use at least 12 characters.")
      .max(128, "Use no more than 128 characters.")
      .refine((value) => /[a-z]/.test(value), "Include a lowercase letter.")
      .refine((value) => /[A-Z]/.test(value), "Include an uppercase letter.")
      .refine((value) => /[0-9]/.test(value), "Include a number."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Both passwords must match.",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;

/**
 * Only allow redirects to paths inside this app. Blocks open-redirect
 * attempts like `?next=https://evil.example` and protocol-relative `//evil`.
 */
export function safeReturnPath(value: string | null | undefined, fallback = "/app/dashboard") {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  return value;
}
