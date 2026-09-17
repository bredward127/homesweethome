"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Browser Supabase client, authenticated as the signed-in user via the anon
 * key. Every query it makes is subject to Row Level Security, so this client
 * can only ever reach rows the user is entitled to.
 *
 * Returns null when Supabase is not configured, which lets the public
 * marketing site and the demo funnel render without credentials.
 */
export function createClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}
