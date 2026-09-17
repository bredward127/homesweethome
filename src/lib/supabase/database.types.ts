/**
 * Database types for the Phase 1 schema (supabase/migrations/0001_foundation.sql).
 *
 * Hand-maintained for now. Once a Supabase project exists, regenerate with:
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts
 * and keep the `Database` export name so the client modules keep compiling.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole =
  | "admin"
  | "acquisition_manager"
  | "closing_specialist"
  | "disposition_manager"
  | "analyst";

export type AuditAction =
  | "sign_in"
  | "sign_out"
  | "sign_in_failed"
  | "password_reset_requested"
  | "record_created"
  | "record_updated"
  | "record_archived"
  | "record_restored"
  | "lead_status_changed"
  | "lead_assigned"
  | "contract_status_changed"
  | "document_uploaded"
  | "document_downloaded"
  | "data_exported"
  | "role_granted"
  | "role_revoked"
  | "settings_updated"
  | "scoring_rules_updated";

type Timestamped = {
  created_at: string;
  updated_at: string;
};

export type ProfileRow = Timestamped & {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  job_title: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  archived_at: string | null;
};

export type UserRoleRow = {
  id: string;
  user_id: string;
  role: AppRole;
  granted_by: string | null;
  created_at: string;
};

export type ServiceAreaRow = Timestamped & {
  id: string;
  slug: string;
  city: string;
  county: string | null;
  state: string;
  postal_codes: string[];
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  archived_at: string | null;
};

export type FunnelSettingsRow = Timestamped & {
  id: string;
  singleton: boolean;
  booking_provider: string;
  booking_url: string | null;
  bookable_score_threshold: number;
  allow_request_call_fallback: boolean;
  show_optional_photo_upload: boolean;
  hot_followup_minutes: number;
  warm_followup_hours: number;
  nurture_followup_days: number;
  updated_by: string | null;
};

export type ScoringRulesRow = Timestamped & {
  id: string;
  version: number;
  is_active: boolean;
  definition: Json;
  hot_threshold: number;
  warm_threshold: number;
  notes: string | null;
  created_by: string | null;
};

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: AuditAction;
  entity_type: string | null;
  entity_id: string | null;
  summary: string | null;
  metadata: Json;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
};

export type ActivityEventRow = {
  id: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string | null;
  event_type: string;
  summary: string;
  metadata: Json;
  created_at: string;
};

/** Insert shapes: server-defaulted columns are optional. */
type Insert<T, Optional extends keyof T> = Omit<T, Optional> & Partial<Pick<T, Optional>>;
type DefaultCols = "id" | "created_at" | "updated_at";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Insert<ProfileRow, "created_at" | "updated_at" | "is_active">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      user_roles: {
        Row: UserRoleRow;
        Insert: Insert<UserRoleRow, "id" | "created_at">;
        Update: Partial<UserRoleRow>;
        Relationships: [];
      };
      service_areas: {
        Row: ServiceAreaRow;
        Insert: Insert<ServiceAreaRow, DefaultCols | "is_active" | "postal_codes" | "state">;
        Update: Partial<ServiceAreaRow>;
        Relationships: [];
      };
      funnel_settings: {
        Row: FunnelSettingsRow;
        Insert: Insert<FunnelSettingsRow, DefaultCols>;
        Update: Partial<FunnelSettingsRow>;
        Relationships: [];
      };
      scoring_rules: {
        Row: ScoringRulesRow;
        Insert: Insert<ScoringRulesRow, DefaultCols | "is_active">;
        Update: Partial<ScoringRulesRow>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: Insert<AuditLogRow, "id" | "created_at" | "metadata">;
        Update: never;
        Relationships: [];
      };
      activity_events: {
        Row: ActivityEventRow;
        Insert: Insert<ActivityEventRow, "id" | "created_at" | "metadata">;
        Update: Partial<ActivityEventRow>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      current_user_roles: { Args: Record<string, never>; Returns: AppRole[] };
      has_role: { Args: { target: AppRole }; Returns: boolean };
      has_any_role: { Args: { targets: AppRole[] }; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_staff: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      app_role: AppRole;
      audit_action: AuditAction;
    };
    CompositeTypes: Record<never, never>;
  };
};
