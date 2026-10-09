import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import type { Lead } from '@/features/leads/schema';
import type { Database, LeadStage } from '@/types/database';
import type { LeadAction } from './stages';

export type LeadEventRow = Database['public']['Tables']['lead_events']['Row'];

export const pipelineApi = {
  /**
   * Performs an atomic pipeline action via `lead_action` RPC.
   */
  async leadAction(args: {
    leadId: string;
    action: LeadAction;
    payload?: Record<string, unknown>;
    expectedStage?: LeadStage | null;
  }): Promise<{ lead: Lead; event_id: number }> {
    try {
      const { data, error } = await supabase.rpc('lead_action', {
        p_lead_id: args.leadId,
        p_action: args.action,
        p_payload: (args.payload || {}) as unknown as Database['public']['Functions']['lead_action']['Args']['p_payload'],
        p_expected_stage: args.expectedStage ?? null,
      });

      if (error) throw error;
      return data as unknown as { lead: Lead; event_id: number };
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Reverts the latest lead event via `undo_lead_event` RPC within 10-minute window.
   */
  async undoLeadEvent(eventId: number): Promise<{ lead: Lead }> {
    try {
      const { data, error } = await supabase.rpc('undo_lead_event', {
        p_event_id: eventId,
      });

      if (error) throw error;
      return data as unknown as { lead: Lead };
    } catch (err) {
      throw toAppError(err);
    }
  },

  /**
   * Fetches timeline events for a lead ordered by occurred_at desc.
   */
  async listLeadEvents(leadId: string, signal?: AbortSignal): Promise<LeadEventRow[]> {
    try {
      let query = supabase
        .from('lead_events')
        .select('*')
        .eq('lead_id', leadId)
        .order('occurred_at', { ascending: false })
        .order('id', { ascending: false });

      if (signal) {
        query = query.abortSignal(signal);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as LeadEventRow[];
    } catch (err) {
      throw toAppError(err);
    }
  },
};
