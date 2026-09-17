/**
 * Environment access.
 *
 * `publicEnv` holds only NEXT_PUBLIC_* values, which Next.js inlines into the
 * client bundle. Anything secret must be read through `serverEnv()`, which is
 * guarded by `server-only` so an accidental client import fails at build time
 * rather than shipping a credential to the browser.
 */

/**
 * Next.js replaces `process.env.NEXT_PUBLIC_*` at build time only for literal
 * member expressions, so each one is spelled out rather than looked up.
 */
export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  mapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
} as const;

/** True when Supabase credentials are present, so the app can run in demo mode without them. */
export const isSupabaseConfigured =
  publicEnv.supabaseUrl.length > 0 && publicEnv.supabaseAnonKey.length > 0;

/** True when a GA4 measurement ID is configured. */
export const isAnalyticsConfigured = publicEnv.gaMeasurementId.length > 0;

/**
 * Feature availability derived purely from NEXT_PUBLIC_* values, safe to read
 * in client components. Server-only integrations are reported by
 * `getServerIntegrationStatus()` instead.
 */
export const publicFeatures = {
  supabase: isSupabaseConfigured,
  analytics: isAnalyticsConfigured,
  addressAutocomplete: publicEnv.mapsApiKey.length > 0,
} as const;
