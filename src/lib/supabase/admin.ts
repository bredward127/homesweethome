import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Service-role Supabase client. This client BYPASSES Row Level Security.
 *
 * Use it only where a request legitimately has no user session and the
 * operation is fully constrained server-side — currently:
 *   - inserting a lead from the public funnel
 *   - writing audit log entries
 *   - the seed script
 *
 * Never import this from a client component (`server-only` makes that a build
 * error), never pass user-supplied filters straight into it, and never return
 * its raw results to a public caller.
 */
export function createAdminClient() {
  const serviceRoleKey = serverEnv.supabaseServiceRoleKey;
  if (!publicEnv.supabaseUrl || !serviceRoleKey) return null;

  return createSupabaseClient<Database>(publicEnv.supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
