import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  newPasswordSchema,
  safeReturnPath,
  signInSchema,
} from "@/lib/validation/auth";

describe("signInSchema", () => {
  it("accepts a valid credential pair and normalises the email", () => {
    const result = signInSchema.safeParse({ email: "  Casey@Example.COM ", password: "hunter2" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("casey@example.com");
  });

  it("rejects a malformed email", () => {
    expect(signInSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(signInSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });

  it("does not impose complexity rules at sign-in", () => {
    // Enforcing the password policy here would disclose it to anyone probing
    // the login form.
    expect(signInSchema.safeParse({ email: "a@b.com", password: "a" }).success).toBe(true);
  });
});

describe("forgotPasswordSchema", () => {
  it("requires a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "team@example.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
  });
});

describe("newPasswordSchema", () => {
  const valid = "CorrectHorse9Battery";

  it("accepts a sufficiently strong matching pair", () => {
    expect(newPasswordSchema.safeParse({ password: valid, confirmPassword: valid }).success).toBe(
      true,
    );
  });

  it("rejects passwords under 12 characters", () => {
    expect(newPasswordSchema.safeParse({ password: "Short1aa", confirmPassword: "Short1aa" }).success).toBe(
      false,
    );
  });

  it.each([
    ["no uppercase", "correcthorse9battery"],
    ["no lowercase", "CORRECTHORSE9BATTERY"],
    ["no number", "CorrectHorseBattery"],
  ])("rejects a password with %s", (_label, password) => {
    expect(newPasswordSchema.safeParse({ password, confirmPassword: password }).success).toBe(false);
  });

  it("rejects a mismatched confirmation and points at the right field", () => {
    const result = newPasswordSchema.safeParse({
      password: valid,
      confirmPassword: `${valid}x`,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });
});

describe("safeReturnPath", () => {
  it("allows in-app paths", () => {
    expect(safeReturnPath("/app/leads")).toBe("/app/leads");
    expect(safeReturnPath("/app/leads?status=new")).toBe("/app/leads?status=new");
  });

  it("falls back when nothing is supplied", () => {
    expect(safeReturnPath(null)).toBe("/app/dashboard");
    expect(safeReturnPath(undefined)).toBe("/app/dashboard");
    expect(safeReturnPath("")).toBe("/app/dashboard");
  });

  it("blocks open redirects", () => {
    expect(safeReturnPath("https://evil.example/app")).toBe("/app/dashboard");
    expect(safeReturnPath("//evil.example")).toBe("/app/dashboard");
    expect(safeReturnPath("/\\evil.example")).toBe("/app/dashboard");
    expect(safeReturnPath("javascript:alert(1)")).toBe("/app/dashboard");
  });
});
