import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import type { LeadStage, Database } from '@/types/database';
import type { Lead, LeadInput, LeadListRow, LeadSort, LeadUpdate } from './schema';

export type Industry = Database['public']['Tables']['industries']['Row'];
export type Country = Database['public']['Tables']['countries']['Row'];

export type DuplicateMatch = {
  id: string;
  name: string;
  stage: LeadStage;
  matched_on: 'instagram' | 'whatsapp' | string;
};

export type LeadSuggestion = {
  id: string;
  name: string;
  instagram_handle: string | null;
  stage: LeadStage;
  score: number;
};

export type StageCount = {
  stage: LeadStage;
  total: number;
};

export const leadsApi = {
  /**
   * Inserts a new lead into the database.
   */
  async createLead(input: LeadInput): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          name: input.name,
          company: input.company || null,
          industry_id: input.industry_id ?? null,
          industry_other: input.industry_other || null,
          job_title: input.job_title || null,
          instagram_handle: input.instagram_handle || null,
          whatsapp_e164: input.whatsapp_e164 || null,
          country_code: input.country_code || null,
          notes: input.notes || null,
          has_content: input.has_content ?? null,
          appears_in_content: input.appears_in_content ?? null,
          has_videographer: input.has_videographer ?? 'unknown',
          problems: input.problems || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Updates fields of an existing lead.
   */
  async updateLead(id: string, patch: LeadUpdate): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(patch)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Soft-deletes a lead.
   */
  async softDeleteLead(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Restores a soft-deleted lead.
   */
  async restoreLead(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ deleted_at: null })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Restores multiple soft-deleted leads in bulk.
   */
  async bulkRestoreLeads(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    try {
      const { error } = await supabase
        .from('leads')
        .update({ deleted_at: null })
        .in('id', ids);

      if (error) throw error;
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Retrieves soft-deleted leads ordered by deleted_at descending.
   */
  async listTrashLeads(signal?: AbortSignal): Promise<Lead[]> {
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .order('id', { ascending: false });

      if (signal) {
        query = query.abortSignal(signal);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Lead[];
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Fetches an active lead by id.
   */
  async getLead(id: string, signal?: AbortSignal): Promise<Lead> {
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null);

      if (signal) {
        query = query.abortSignal(signal);
      }

      const { data, error } = await query.single();
      if (error) throw error;
      return data as Lead;
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Executes high-performance search and pagination via search_leads RPC.
   */
  async searchLeads(
    args: {
      p_query?: string | null;
      p_stages?: LeadStage[] | null;
      p_industries?: number[] | null;
      p_countries?: string[] | null;
      p_filters?: Record<string, unknown>;
      p_sort?: LeadSort;
      p_cursor?: unknown;
      p_limit?: number;
    },
    signal?: AbortSignal
  ): Promise<LeadListRow[]> {
    try {
      let rpcCall = supabase.rpc('search_leads', {
        p_query: args.p_query ?? null,
        p_stages: args.p_stages ?? null,
        p_industries: args.p_industries ?? null,
        p_countries: args.p_countries ?? null,
        p_filters: (args.p_filters ?? {}) as Database['public']['Functions']['search_leads']['Args']['p_filters'],
        p_sort: args.p_sort ?? 'newest',
        p_cursor: (args.p_cursor ?? null) as Database['public']['Functions']['search_leads']['Args']['p_cursor'],
        p_limit: args.p_limit ?? 50,
      });

      if (signal) {
        rpcCall = rpcCall.abortSignal(signal);
      }

      const { data, error } = await rpcCall;
      if (error) throw error;
      return (data || []) as unknown as LeadListRow[];
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Returns lead counts grouped by stage via lead_stage_counts RPC.
   */
  async stageCounts(
    args: {
      p_query?: string | null;
      p_industries?: number[] | null;
      p_countries?: string[] | null;
      p_filters?: Record<string, unknown>;
    },
    signal?: AbortSignal
  ): Promise<StageCount[]> {
    try {
      let rpcCall = supabase.rpc('lead_stage_counts', {
        p_query: args.p_query ?? null,
        p_industries: args.p_industries ?? null,
        p_countries: args.p_countries ?? null,
        p_filters: (args.p_filters ?? {}) as Database['public']['Functions']['lead_stage_counts']['Args']['p_filters'],
      });

      if (signal) {
        rpcCall = rpcCall.abortSignal(signal);
      }

      const { data, error } = await rpcCall;
      if (error) throw error;
      return (data || []) as unknown as StageCount[];
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Fuzzy matches leads when zero direct results are returned ("هل تقصد؟").
   */
  async suggestLeads(
    args: { p_query: string; p_limit?: number },
    signal?: AbortSignal
  ): Promise<LeadSuggestion[]> {
    try {
      let rpcCall = supabase.rpc('suggest_leads', {
        p_query: args.p_query,
        p_limit: args.p_limit ?? 5,
      });

      if (signal) {
        rpcCall = rpcCall.abortSignal(signal);
      }

      const { data, error } = await rpcCall;
      if (error) throw error;
      return (data || []) as unknown as LeadSuggestion[];
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Checks for duplicate leads by Instagram handle or WhatsApp phone number.
   */
  async checkDuplicate(
    args: { p_handle?: string | null; p_phone?: string | null; p_exclude?: string | null },
    signal?: AbortSignal
  ): Promise<DuplicateMatch[]> {
    try {
      let rpcCall = supabase.rpc('check_duplicate', {
        p_handle: args.p_handle ?? null,
        p_phone: args.p_phone ?? null,
        p_exclude: args.p_exclude ?? null,
      });

      if (signal) {
        rpcCall = rpcCall.abortSignal(signal);
      }

      const { data, error } = await rpcCall;
      if (error) throw error;
      return (data || []) as unknown as DuplicateMatch[];
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Retrieves active industries ordered by sort_order.
   */
  async listIndustries(signal?: AbortSignal): Promise<Industry[]> {
    try {
      let query = supabase
        .from('industries')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

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
   * Retrieves all reference countries.
   */
  async listCountries(signal?: AbortSignal): Promise<Country[]> {
    try {
      let query = supabase
        .from('countries')
        .select('*')
        .order('name_ar', { ascending: true });

      if (signal) {
        query = query.abortSignal(signal);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Country[];
    } catch (err) {
      throw toAppError(err);
    }
  },
};
