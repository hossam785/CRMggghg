import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import type { Database } from '@/types/database';

export type SettingsRow = Database['public']['Tables']['settings']['Row'];

export const DEFAULT_SETTINGS: SettingsRow = {
  owner_id: '',
  locale: 'ar',
  timezone: 'Africa/Cairo',
  default_country: 'EG',
  fu1_after_days: 2,
  fu2_after_days: 3,
  fu3_after_days: 4,
  give_up_after_days: 5,
  updated_at: '2026-10-09T00:00:00.000Z',
};

export const settingsApi = {
  /**
   * Fetches the user settings record. Falls back to default configuration if not yet created.
   */
  async getSettings(signal?: AbortSignal): Promise<SettingsRow> {
    try {
      let query = supabase.from('settings').select('*');
      if (signal) {
        query = query.abortSignal(signal);
      }
      const { data, error } = await query.single();
      if (error) {
        return DEFAULT_SETTINGS;
      }
      return data as SettingsRow;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  /**
   * Updates user settings.
   */
  async updateSettings(patch: Partial<SettingsRow>): Promise<SettingsRow> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .update(patch)
        .select()
        .single();
      if (error) throw error;
      return data as SettingsRow;
    } catch (err) {
      throw toAppError(err);
    }
  },
};
