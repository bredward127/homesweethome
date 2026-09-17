/**
 * Database types for the schema in supabase/migrations/.
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


// --------------------------------------------------- Phase 2: lead capture

export type PropertyTypeEnum =
  | "single_family" | "duplex" | "multi_family" | "condo_townhome"
  | "mobile_manufactured" | "land" | "other";

export type OccupancyStatusEnum = "owner_occupied" | "tenant_occupied" | "vacant" | "unknown";

export type PropertyConditionEnum =
  | "move_in_ready" | "minor_updates" | "major_repairs" | "full_renovation" | "not_sure";

export type TimelineBucketEnum = "asap" | "1_3_months" | "3_6_months" | "over_6_months" | "researching";

export type DecisionMakerStatusEnum = "sole" | "shared" | "unsure";

export type MortgageStatusEnum = "yes" | "no" | "unsure" | "prefer_not_to_say";

export type ContactMethodEnum = "phone" | "text" | "email";

export type ContactTimeEnum = "morning" | "afternoon" | "evening" | "anytime";

export type LeadTierEnum = "hot" | "warm" | "nurture";

export type LeadStatusEnum =
  | "new" | "attempting_contact" | "contacted" | "qualified"
  | "appointment_booked" | "appointment_completed" | "offer_preparation"
  | "offer_sent" | "negotiating" | "under_contract" | "dead_disqualified"
  | "nurture" | "closed_assigned" | "closed_purchased" | "lost";

export type TaskTypeEnum =
  | "call" | "text" | "email" | "appointment" | "document" | "offer" | "title" | "follow_up" | "other";

export type TaskPriorityEnum = "low" | "medium" | "high";

export type AppointmentStatusEnum = "requested" | "scheduled" | "completed" | "cancelled" | "no_show";

export type PropertyRow = Timestamped & {
  id: string;
  street: string | null;
  city: string;
  state: string;
  postal_code: string;
  county: string | null;
  address_unknown: boolean;
  property_description: string | null;
  property_type: PropertyTypeEnum | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  occupancy: OccupancyStatusEnum | null;
  is_primary_residence: string | null;
  condition: PropertyConditionEnum | null;
  repair_areas: string[];
  condition_notes: string | null;
  estimated_value: number | null;
  estimated_repair_cost: number | null;
  mortgage_balance: number | null;
  parcel_number: string | null;
  internal_notes: string | null;
  service_area_id: string | null;
  in_service_area: boolean;
  created_by: string | null;
  updated_by: string | null;
  archived_at: string | null;
};

export type LeadRow = Timestamped & {
  id: string;
  reference: string;
  property_id: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  preferred_contact_method: ContactMethodEnum;
  best_time_to_contact: ContactTimeEnum;
  motivations: string[];
  situation_notes: string | null;
  timeline: TimelineBucketEnum | null;
  decision_maker: DecisionMakerStatusEnum | null;
  mortgage_status: MortgageStatusEnum | null;
  payoff_range: string | null;
  status: LeadStatusEnum;
  tier: LeadTierEnum | null;
  score: number | null;
  assigned_to: string | null;
  assigned_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  landing_page: string | null;
  first_touch_at: string | null;
  last_touch_at: string | null;
  source: string;
  first_contacted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  archived_at: string | null;
};

export type LeadScoreRow = {
  id: string;
  lead_id: string;
  total: number;
  tier: LeadTierEnum;
  reasons: Json;
  flags: Json;
  rules_version: number;
  scored_at: string;
  created_at: string;
};

export type LeadFunnelSessionRow = Timestamped & {
  id: string;
  lead_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_step: string | null;
  completed: boolean;
  raw_answers: Json;
  landing_page: string | null;
  referrer: string | null;
  user_agent: string | null;
  ip_hash: string | null;
};

export type LeadConsentRow = {
  id: string;
  lead_id: string;
  consent_type: "contact" | "sms";
  granted: boolean;
  consent_text: string;
  policy_version: string;
  granted_at: string;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
};

export type LeadAssignmentRow = {
  id: string;
  lead_id: string;
  assigned_to: string | null;
  assigned_by: string | null;
  reason: string | null;
  assigned_at: string;
  unassigned_at: string | null;
  created_at: string;
};

export type TaskRow = Timestamped & {
  id: string;
  title: string;
  description: string | null;
  task_type: TaskTypeEnum;
  priority: TaskPriorityEnum;
  due_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  assigned_to: string | null;
  lead_id: string | null;
  property_id: string | null;
  created_by: string | null;
  archived_at: string | null;
};

export type AppointmentRow = Timestamped & {
  id: string;
  lead_id: string | null;
  property_id: string | null;
  assigned_to: string | null;
  status: AppointmentStatusEnum;
  scheduled_for: string | null;
  duration_minutes: number | null;
  booking_provider: string | null;
  booking_reference: string | null;
  notes: string | null;
  created_by: string | null;
  archived_at: string | null;
};

/**
 * Insert shapes.
 *
 * A column is optional on insert when it is nullable (Postgres will store
 * NULL) or when it is listed in `Optional` because the database supplies a
 * default. This mirrors how `supabase gen types` shapes its Insert types, so
 * swapping this file for a generated one does not break callers.
 */
type NullableKeys<T> = { [K in keyof T]-?: null extends T[K] ? K : never }[keyof T];

type Insert<T, Optional extends keyof T> = Omit<T, Optional | NullableKeys<T>> &
  Partial<Pick<T, (Optional & keyof T) | NullableKeys<T>>>;

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
      properties: {
        Row: PropertyRow;
        Insert: Insert<
          PropertyRow,
          DefaultCols | "state" | "address_unknown" | "repair_areas" | "in_service_area"
        >;
        Update: Partial<PropertyRow>;
        Relationships: [];
      };
      leads: {
        Row: LeadRow;
        Insert: Insert<
          LeadRow,
          | DefaultCols
          | "reference"
          | "status"
          | "source"
          | "motivations"
          | "preferred_contact_method"
          | "best_time_to_contact"
        >;
        Update: Partial<LeadRow>;
        Relationships: [];
      };
      lead_scores: {
        Row: LeadScoreRow;
        Insert: Insert<LeadScoreRow, "id" | "created_at" | "scored_at" | "reasons" | "flags">;
        Update: Partial<LeadScoreRow>;
        Relationships: [];
      };
      lead_funnel_sessions: {
        Row: LeadFunnelSessionRow;
        Insert: Insert<LeadFunnelSessionRow, DefaultCols | "completed" | "raw_answers">;
        Update: Partial<LeadFunnelSessionRow>;
        Relationships: [];
      };
      lead_consents: {
        Row: LeadConsentRow;
        Insert: Insert<LeadConsentRow, "id" | "created_at" | "granted_at">;
        // Consent is append-only evidence: never updated through the API.
        Update: never;
        Relationships: [];
      };
      lead_assignments: {
        Row: LeadAssignmentRow;
        Insert: Insert<LeadAssignmentRow, "id" | "created_at" | "assigned_at">;
        Update: Partial<LeadAssignmentRow>;
        Relationships: [];
      };
      tasks: {
        Row: TaskRow;
        Insert: Insert<TaskRow, DefaultCols | "task_type" | "priority">;
        Update: Partial<TaskRow>;
        Relationships: [];
      };
      appointments: {
        Row: AppointmentRow;
        Insert: Insert<AppointmentRow, DefaultCols | "status">;
        Update: Partial<AppointmentRow>;
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
      can_read_lead: { Args: { target_lead_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: AppRole;
      audit_action: AuditAction;
      property_type: PropertyTypeEnum;
      occupancy_status: OccupancyStatusEnum;
      property_condition: PropertyConditionEnum;
      timeline_bucket: TimelineBucketEnum;
      decision_maker_status: DecisionMakerStatusEnum;
      mortgage_status: MortgageStatusEnum;
      contact_method: ContactMethodEnum;
      contact_time: ContactTimeEnum;
      lead_tier: LeadTierEnum;
      lead_status: LeadStatusEnum;
      task_type: TaskTypeEnum;
      task_priority: TaskPriorityEnum;
      appointment_status: AppointmentStatusEnum;
    };
    CompositeTypes: Record<never, never>;
  };
};
