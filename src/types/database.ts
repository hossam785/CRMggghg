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

export type LeadEventType =
  | 'created'
  | 'message_sent'
  | 'follow_up_sent'
  | 'reply_received'
  | 'meeting_booked'
  | 'proposal_sent'
  | 'won'
  | 'lost'
  | 'stage_set'
  | 'reopened'
  | 'reminder_set'
  | 'snoozed'
  | 'restarted';

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
      lead_events: {
        Row: {
          id: number;
          owner_id: string;
          lead_id: string;
          type: LeadEventType;
          from_stage: LeadStage | null;
          to_stage: LeadStage | null;
          prev_state: Json | null;
          meta: Json;
          occurred_at: string;
          undone_at: string | null;
        };
        Insert: {
          id?: number;
          owner_id?: string;
          lead_id: string;
          type: LeadEventType;
          from_stage?: LeadStage | null;
          to_stage?: LeadStage | null;
          prev_state?: Json | null;
          meta?: Json;
          occurred_at?: string;
          undone_at?: string | null;
        };
        Update: {
          id?: number;
          owner_id?: string;
          lead_id?: string;
          type?: LeadEventType;
          from_stage?: LeadStage | null;
          to_stage?: LeadStage | null;
          prev_state?: Json | null;
          meta?: Json;
          occurred_at?: string;
          undone_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_events_lead_id_fkey';
            columns: ['lead_id'];
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      normalize_search: {
        Args: { t: string | null };
        Returns: string;
      };
      lead_filter_sql: {
        Args: {
          p_query?: string | null;
          p_stages?: LeadStage[] | null;
          p_industries?: number[] | null;
          p_countries?: string[] | null;
          p_filters?: Json | null;
        };
        Returns: string;
      };
      search_leads: {
        Args: {
          p_query?: string | null;
          p_stages?: LeadStage[] | null;
          p_industries?: number[] | null;
          p_countries?: string[] | null;
          p_filters?: Json | null;
          p_sort?: string;
          p_cursor?: Json | null;
          p_limit?: number;
        };
        Returns: {
          id: string;
          name: string;
          company: string | null;
          instagram_handle: string | null;
          whatsapp_e164: string | null;
          industry_id: number | null;
          industry_other: string | null;
          country_code: string | null;
          stage: LeadStage;
          last_contacted_at: string | null;
          next_follow_up_on: string | null;
          follow_ups_sent: number;
          missing_fields: string[];
          created_at: string;
          rank: number;
          next_cursor: Json | null;
        }[];
      };
      lead_stage_counts: {
        Args: {
          p_query?: string | null;
          p_industries?: number[] | null;
          p_countries?: string[] | null;
          p_filters?: Json | null;
        };
        Returns: {
          stage: LeadStage;
          total: number;
        }[];
      };
      suggest_leads: {
        Args: {
          p_query: string;
          p_limit?: number;
        };
        Returns: {
          id: string;
          name: string;
          instagram_handle: string | null;
          stage: LeadStage;
          score: number;
        }[];
      };
      check_duplicate: {
        Args: {
          p_handle?: string | null;
          p_phone?: string | null;
          p_exclude?: string | null;
        };
        Returns: {
          id: string;
          name: string;
          stage: LeadStage;
          matched_on: 'instagram' | 'whatsapp' | string;
        }[];
      };
      assert_stage: {
        Args: {
          p_current: LeadStage;
          p_allowed: LeadStage[];
        };
        Returns: void;
      };
      lead_action: {
        Args: {
          p_lead_id: string;
          p_action: string;
          p_payload?: Json;
          p_expected_stage?: LeadStage | null;
        };
        Returns: {
          lead: Database['public']['Tables']['leads']['Row'];
          event_id: number;
        };
      };
      undo_lead_event: {
        Args: {
          p_event_id: number;
        };
        Returns: {
          lead: Database['public']['Tables']['leads']['Row'];
        };
      };
      follow_up_queue: {
        Args: {
          p_waiting_limit?: number;
        };
        Returns: {
          bucket: string;
          bucket_total: number;
          days_overdue: number;
          id: string;
          name: string;
          instagram_handle: string | null;
          whatsapp_e164: string | null;
          industry_id: number | null;
          country_code: string | null;
          stage: LeadStage;
          last_contacted_at: string | null;
          next_follow_up_on: string | null;
          reminder_note: string | null;
          meeting_at: string | null;
        }[];
      };
      export_leads: {
        Args: {
          p_query?: string | null;
          p_stages?: LeadStage[] | null;
          p_industries?: number[] | null;
          p_countries?: string[] | null;
          p_filters?: Json | null;
          p_cursor?: string | null;
          p_limit?: number;
        };
        Returns: {
          id: string;
          name: string;
          company: string | null;
          job_title: string | null;
          instagram_handle: string | null;
          whatsapp_e164: string | null;
          country_code: string | null;
          country_name_ar: string | null;
          country_name_en: string | null;
          industry_name_ar: string | null;
          industry_name_en: string | null;
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
          notes: string | null;
          has_content: boolean | null;
          appears_in_content: boolean | null;
          has_videographer: TriState;
          problems: string | null;
          created_at: string;
          updated_at: string;
          next_cursor: string | null;
        }[];
      };
    };
    Enums: {
      lead_stage: LeadStage;
      tri_state: TriState;
      lead_event_type: LeadEventType;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Lead = Database['public']['Tables']['leads']['Row'];
export type LeadEvent = Database['public']['Tables']['lead_events']['Row'];
export type Settings = Database['public']['Tables']['settings']['Row'];

export type FollowUpBucket =
  | 'due_fu1'
  | 'due_fu2'
  | 'due_fu3'
  | 'reminder'
  | 'meeting_today'
  | 'exhausted'
  | 'waiting';

export type FollowUpQueueRow = Database['public']['Functions']['follow_up_queue']['Returns'][number];
