import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import type { Database } from '@/types/database';

export type SettingsRow = Database['public']['Tables']['settings']['Row'];
export type Industry = Database['public']['Tables']['industries']['Row'];

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

export const industriesApi = {
  /**
   * Fetches all user industries (both active and inactive) ordered by sort_order.
   */
  async listAllIndustries(signal?: AbortSignal): Promise<Industry[]> {
    try {
      let query = supabase
        .from('industries')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });

      if (signal) {
        query = query.abortSignal(signal);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Industry[];
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Creates a new industry with slug key generated from English label.
   */
  async createIndustry(payload: {
    label_ar: string;
    label_en: string;
    sort_order?: number;
  }): Promise<Industry> {
    try {
      const baseSlug =
        payload.label_en
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '') || 'ind';
      const key = `${baseSlug}_${Date.now().toString(36).slice(-4)}`;

      const { data, error } = await supabase
        .from('industries')
        .insert({
          key,
          label_ar: payload.label_ar.trim(),
          label_en: payload.label_en.trim(),
          sort_order: payload.sort_order ?? 99,
          is_active: true,
          is_other: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Industry;
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Updates an existing industry (labels, is_active, sort_order).
   */
  async updateIndustry(
    id: number,
    patch: Partial<Pick<Industry, 'label_ar' | 'label_en' | 'is_active' | 'sort_order'>>
  ): Promise<Industry> {
    try {
      const { data, error } = await supabase
        .from('industries')
        .update(patch)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Industry;
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Reorders industries by updating sort_order for given IDs.
   */
  async reorderIndustries(
    orders: { id: number; sort_order: number }[]
  ): Promise<void> {
    try {
      await Promise.all(
        orders.map((item) =>
          supabase
            .from('industries')
            .update({ sort_order: item.sort_order })
            .eq('id', item.id)
        )
      );
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Checks if an industry is referenced by any leads.
   */
  async getReferencedCount(id: number): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('industry_id', id);

      if (error) throw error;
      return count ?? 0;
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Deletes an industry if no leads reference it.
   */
  async deleteIndustry(
    id: number
  ): Promise<{ success: boolean; referencedCount: number }> {
    try {
      const count = await this.getReferencedCount(id);
      if (count > 0) {
        return { success: false, referencedCount: count };
      }

      const { error } = await supabase.from('industries').delete().eq('id', id);
      if (error) throw error;

      return { success: true, referencedCount: 0 };
    } catch (err) {
      throw toAppError(err);
    }
  },
};
