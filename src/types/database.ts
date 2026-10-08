export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LeadStage =
  | 'new'
  | 'message_sent'
  | 'follow_up_1'
  | 'follow_up_2'
  | 'follow_up_3'
  | 'replied'
  | 'meeting_booked'
  | 'proposal_sent'
  | 'won'
  | 'lost';

export type TriState = 'yes' | 'no' | 'unknown';

export type LostReason =
  | 'not_interested'
  | 'no_reply'
  | 'budget'
  | 'timing'
  | 'other';

export interface Database {
  public: {
    Tables: {
      settings: {
        Row: {
          owner_id: string;
          locale: 'ar' | 'en';
          timezone: string;
          default_country: string | null;
          fu1_after_days: number;
          fu2_after_days: number;
          fu3_after_days: number;
          give_up_after_days: number;
          updated_at: string;
        };
        Insert: {
          owner_id?: string;
          locale?: 'ar' | 'en';
          timezone?: string;
          default_country?: string | null;
          fu1_after_days?: number;
          fu2_after_days?: number;
          fu3_after_days?: number;
          give_up_after_days?: number;
          updated_at?: string;
        };
        Update: {
          owner_id?: string;
          locale?: 'ar' | 'en';
          timezone?: string;
          default_country?: string | null;
          fu1_after_days?: number;
          fu2_after_days?: number;
          fu3_after_days?: number;
          give_up_after_days?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      backup_settings: {
        Row: {
          owner_id: string;
          frequency: 'off' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
          weekday: number | null;
          month_day: number | null;
          hour_local: number;
          format: 'xlsx' | 'csv_zip' | 'json';
          keep_last: number;
          notify_inapp: boolean;
          notify_push: boolean;
          notify_email: boolean;
          next_run_at: string | null;
          last_reminded_at: string | null;
        };
        Insert: {
          owner_id?: string;
          frequency?: 'off' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
          weekday?: number | null;
          month_day?: number | null;
          hour_local?: number;
          format?: 'xlsx' | 'csv_zip' | 'json';
          keep_last?: number;
          notify_inapp?: boolean;
          notify_push?: boolean;
          notify_email?: boolean;
          next_run_at?: string | null;
          last_reminded_at?: string | null;
        };
        Update: {
          owner_id?: string;
          frequency?: 'off' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
          weekday?: number | null;
          month_day?: number | null;
          hour_local?: number;
          format?: 'xlsx' | 'csv_zip' | 'json';
          keep_last?: number;
          notify_inapp?: boolean;
          notify_push?: boolean;
          notify_email?: boolean;
          next_run_at?: string | null;
          last_reminded_at?: string | null;
        };
        Relationships: [];
      };
      countries: {
        Row: {
          code: string;
          name_ar: string;
          name_en: string;
          dial_code: string | null;
        };
        Insert: {
          code: string;
          name_ar: string;
          name_en: string;
          dial_code?: string | null;
        };
        Update: {
          code?: string;
          name_ar?: string;
          name_en?: string;
          dial_code?: string | null;
        };
        Relationships: [];
      };
      industries: {
        Row: {
          id: number;
          owner_id: string;
          key: string;
          label_ar: string;
          label_en: string;
          sort_order: number;
          is_other: boolean;
          is_active: boolean;
        };
        Insert: {
          id?: never;
          owner_id?: string;
          key: string;
          label_ar: string;
          label_en: string;
          sort_order?: number;
          is_other?: boolean;
          is_active?: boolean;
        };
        Update: {
          id?: never;
          owner_id?: string;
          key?: string;
          label_ar?: string;
          label_en?: string;
          sort_order?: number;
          is_other?: boolean;
          is_active?: boolean;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          company: string | null;
          industry_id: number | null;
          industry_other: string | null;
          job_title: string | null;
          instagram_handle: string | null;
          whatsapp_e164: string | null;
          country_code: string | null;
          notes: string | null;
          has_content: boolean | null;
          appears_in_content: boolean | null;
          has_videographer: TriState;
          problems: string | null;
          stage: LeadStage;
          stage_changed_at: string;
          first_message_at: string | null;
          last_contacted_at: string | null;
          follow_ups_sent: number;
          next_follow_up_on: string | null;
          reminder_note: string | null;
          replied_at: string | null;
          meeting_booked_at: string | null;
          meeting_at: string | null;
          proposal_sent_at: string | null;
          won_at: string | null;
          lost_at: string | null;
          lost_reason: LostReason | null;
          import_job_id: string | null;
          missing_fields: string[];
          search_text: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          name: string;
          company?: string | null;
          industry_id?: number | null;
          industry_other?: string | null;
          job_title?: string | null;
          instagram_handle?: string | null;
          whatsapp_e164?: string | null;
          country_code?: string | null;
          notes?: string | null;
          has_content?: boolean | null;
          appears_in_content?: boolean | null;
          has_videographer?: TriState;
          problems?: string | null;
          stage?: LeadStage;
          stage_changed_at?: string;
          first_message_at?: string | null;
          last_contacted_at?: string | null;
          follow_ups_sent?: number;
          next_follow_up_on?: string | null;
          reminder_note?: string | null;
          replied_at?: string | null;
          meeting_booked_at?: string | null;
          meeting_at?: string | null;
          proposal_sent_at?: string | null;
          won_at?: string | null;
          lost_at?: string | null;
          lost_reason?: LostReason | null;
          import_job_id?: string | null;
          missing_fields?: string[];
          search_text?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          company?: string | null;
          industry_id?: number | null;
          industry_other?: string | null;
          job_title?: string | null;
          instagram_handle?: string | null;
          whatsapp_e164?: string | null;
          country_code?: string | null;
          notes?: string | null;
          has_content?: boolean | null;
          appears_in_content?: boolean | null;
          has_videographer?: TriState;
          problems?: string | null;
          stage?: LeadStage;
          stage_changed_at?: string;
          first_message_at?: string | null;
          last_contacted_at?: string | null;
          follow_ups_sent?: number;
          next_follow_up_on?: string | null;
          reminder_note?: string | null;
          replied_at?: string | null;
          meeting_booked_at?: string | null;
          meeting_at?: string | null;
          proposal_sent_at?: string | null;
          won_at?: string | null;
          lost_at?: string | null;
          lost_reason?: LostReason | null;
          import_job_id?: string | null;
          missing_fields?: string[];
          search_text?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: unknown[];
      };
    };
    Views: Record<
      string,
      {
        Row: Record<string, unknown>;
        Relationships: unknown[];
      }
    >;
    Functions: {
      normalize_search: {
        Args: { t: string | null };
        Returns: string;
      };
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      lead_stage: LeadStage;
      tri_state: TriState;
      [key: string]: unknown;
    };
    CompositeTypes: Record<string, unknown>;
  };
}
