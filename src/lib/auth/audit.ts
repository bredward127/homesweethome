import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditAction, Json } from "@/lib/supabase/database.types";

/**
 * Hash a client IP before storing it.
 *
 * Audit entries need to distinguish actors without retaining a raw IP
 * address. The hash is salted with the service-role key so the digest is not
 * reversible from a database dump alone, and truncated because only equality
 * matters here.
 */
function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "home-sweet-home";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** Best-effort client IP from the proxy headers Vercel sets. */
function clientIpFrom(headerList: Headers): string | null {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return headerList.get("x-real-ip");
}

export type AuditEntry = {
  action: AuditAction;
  actorId?: string | null;
  actorEmail?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  summary?: string | null;
  /**
   * Structured context for the entry. Never put seller PII, document
   * contents, message bodies, or credentials in here — record identifiers
   * and changed field names instead.
   */
  metadata?: Record<string, Json>;
};

/**
 * Append an audit entry.
 *
 * Writes through the service-role client because `audit_logs` has no insert
 * policy for authenticated users — the table is append-only from the
 * application's perspective and unreachable from the browser.
 *
 * Auditing must never break the action it is recording, so failures are
 * logged to the server console and swallowed.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[audit] skipped (no service role key configured):", entry.action);
    }
    return;
  }

  let ipHash: string | null = null;
  let userAgent: string | null = null;
  try {
    const headerList = await headers();
    ipHash = hashIp(clientIpFrom(headerList));
    userAgent = headerList.get("user-agent");
  } catch {
    // Outside a request scope (for example the seed script).
  }

  const { error } = await supabase.from("audit_logs").insert({
    action: entry.action,
    actor_id: entry.actorId ?? null,
    actor_email: entry.actorEmail ?? null,
    entity_type: entry.entityType ?? null,
    entity_id: entry.entityId ?? null,
    summary: entry.summary ?? null,
    metadata: (entry.metadata ?? {}) as Json,
    ip_hash: ipHash,
    user_agent: userAgent,
  });

  if (error) console.error("[audit] failed to write entry:", error.message);
}
