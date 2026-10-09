import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export interface RunCommitOptions {
  jobId: string;
  totalToCommit: number;
  supabase: SupabaseClient<Database>;
  signal?: AbortSignal;
  onProgress?: (committed: number, total: number) => void;
}

export interface CommitResult {
  inserted: number;
  updated: number;
  total: number;
  stoppedEarly?: boolean;
}

export async function runCommit({
  jobId,
  totalToCommit,
  supabase,
  signal,
  onProgress,
}: RunCommitOptions): Promise<CommitResult> {
  let totalInserted = 0;
  let totalUpdated = 0;
  let remaining = totalToCommit;

  while (remaining > 0) {
    if (signal?.aborted) {
      return {
        inserted: totalInserted,
        updated: totalUpdated,
        total: totalToCommit,
        stoppedEarly: true,
      };
    }

    const { data, error } = await supabase.rpc('commit_import', {
      p_job: jobId,
      p_batch: 2000,
    });

    if (error) {
      throw new Error(`Failed to commit batch: ${error.message}`);
    }

    const res = data as { inserted: number; updated: number; remaining: number };
    totalInserted += res.inserted || 0;
    totalUpdated += res.updated || 0;
    remaining = res.remaining ?? 0;

    const committedSoFar = totalToCommit - remaining;
    onProgress?.(Math.max(0, committedSoFar), totalToCommit);

    if (res.inserted === 0 && res.updated === 0 && remaining > 0) {
      // Avoid infinite loop if no rows were processed but remaining > 0
      break;
    }
  }

  onProgress?.(totalToCommit, totalToCommit);
  return {
    inserted: totalInserted,
    updated: totalUpdated,
    total: totalToCommit,
  };
}

export async function runRollback(
  jobId: string,
  supabase: SupabaseClient<Database>
): Promise<{ deleted: number; restored: number }> {
  const { data, error } = await supabase.rpc('rollback_import', {
    p_job: jobId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as { deleted: number; restored: number };
}
