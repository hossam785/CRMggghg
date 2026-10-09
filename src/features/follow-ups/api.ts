import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { type FollowUpQueueRow } from '@/types/database';

export const followUpsApi = {
  /**
   * Fetches the grouped follow-up queue rows via `follow_up_queue` RPC.
   */
  async getFollowUpQueue(
    waitingLimit: number = 100,
    signal?: AbortSignal
  ): Promise<FollowUpQueueRow[]> {
    try {
      let query = supabase.rpc('follow_up_queue', {
        p_waiting_limit: waitingLimit,
      });

      if (signal) {
        query = query.abortSignal(signal);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as FollowUpQueueRow[];
    } catch (err) {
      throw toAppError(err);
    }
  },
};
