import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { publicEnv, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Server Supabase client scoped to the signed-in user's session.
 *
 * Uses the anon key, so RLS applies to every query — this is the client all
 * ordinary server components and server actions should use. Returns null when
 * Supabase is not configured.
 */
export async function createClient() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();

  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a server component, where cookies are read-only.
          // Session refresh is handled by the edge proxy instead.
        }
      },
    },
  });
}
