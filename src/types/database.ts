export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
    Functions: Record<
      string,
      {
        Args: Record<string, unknown>;
        Returns: unknown;
      }
    >;
    Enums: Record<string, unknown>;
    CompositeTypes: Record<string, unknown>;
  };
}
