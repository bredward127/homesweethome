import "server-only";

/**
 * Server-only environment access. Importing this module from a client
 * component is a build error, which keeps secrets out of the browser bundle.
 */
function optional(name: string): string {
  return process.env[name]?.trim() ?? "";
}

/**
 * Read a variable that must exist for the calling code path to work.
 * Throws at call time (not module load) so a missing value degrades a single
 * feature instead of taking down the whole app.
 */
export function requireEnv(name: string): string {
  const value = optional(name);
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. See .env.example and README.md.`,
    );
  }
  return value;
}

export const serverEnv = {
  get supabaseServiceRoleKey() {
    return optional("SUPABASE_SERVICE_ROLE_KEY");
  },
  get resendApiKey() {
    return optional("RESEND_API_KEY");
  },
  get emailFromAddress() {
    return optional("EMAIL_FROM_ADDRESS");
  },
  get twilioAccountSid() {
    return optional("TWILIO_ACCOUNT_SID");
  },
  get twilioAuthToken() {
    return optional("TWILIO_AUTH_TOKEN");
  },
  get twilioPhoneNumber() {
    return optional("TWILIO_PHONE_NUMBER");
  },
  get calendlyUrl() {
    return optional("CALENDLY_URL");
  },
  get falKey() {
    return optional("FAL_KEY");
  },
} as const;

/**
 * Which optional integrations are wired up. Rendered read-only in
 * /app/settings/integrations so admins can see what still needs configuring.
 * Never returns the values themselves.
 */
export function getServerIntegrationStatus() {
  return {
    supabaseServiceRole: serverEnv.supabaseServiceRoleKey.length > 0,
    email: serverEnv.resendApiKey.length > 0,
    sms:
      serverEnv.twilioAccountSid.length > 0 &&
      serverEnv.twilioAuthToken.length > 0 &&
      serverEnv.twilioPhoneNumber.length > 0,
    booking: serverEnv.calendlyUrl.length > 0,
    mediaGeneration: serverEnv.falKey.length > 0,
  } as const;
}
