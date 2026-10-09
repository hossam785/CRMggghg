import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { ImportWorkerApi, ImportCounts } from './types';
import { AppError } from '@/lib/errors';

export interface RunStagingOptions {
  workerApi: ImportWorkerApi;
  jobId: string;
  totalRows: number;
  startRowIdx?: number;
  supabase: SupabaseClient<Database>;
  signal?: AbortSignal;
  onProgress?: (staged: number, total: number) => void;
}

const BATCH_SIZE = 1000;
const MAX_RETRIES = 5;

export async function runStaging({
  workerApi,
  jobId,
  totalRows,
  startRowIdx = 0,
  supabase,
  signal,
  onProgress,
}: RunStagingOptions): Promise<ImportCounts> {
  let currentIdx = startRowIdx;

  while (currentIdx < totalRows) {
    if (signal?.aborted) {
      throw new AppError('CANCELLED', { message: 'Import was cancelled' });
    }

    const batch = await workerApi.takeBatch(currentIdx, BATCH_SIZE);
    if (!batch || batch.length === 0) break;

    // Retry loop with exponential backoff
    let attempts = 0;
    let success = false;
    let lastErr: unknown = null;

    while (attempts < MAX_RETRIES && !success) {
      if (signal?.aborted) {
        throw new AppError('CANCELLED', { message: 'Import was cancelled' });
      }

      try {
        const { error } = await supabase.rpc('stage_import_rows', {
          p_job: jobId,
          p_rows: batch as unknown as import('@/types/database').Json,
        });

        if (error) {
          throw new Error(error.message);
        }

        success = true;
      } catch (err) {
        lastErr = err;
        attempts++;
        if (attempts >= MAX_RETRIES) {
          throw new Error(`Failed to stage batch at row ${currentIdx + 1}: ${String(lastErr)}`);
        }
        const delayMs = Math.min(1000 * Math.pow(2, attempts - 1), 30000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    currentIdx += batch.length;
    onProgress?.(currentIdx, totalRows);
  }

  if (signal?.aborted) {
    throw new AppError('CANCELLED', { message: 'Import was cancelled' });
  }

  // Finalize staging: run set-based duplicate detection & compute final counts
  const { data: countsData, error: finalizeErr } = await supabase.rpc('finalize_import_staging', {
    p_job: jobId,
  });

  if (finalizeErr) {
    throw new Error(`Failed to finalize staging: ${finalizeErr.message}`);
  }

  const rawCounts = (countsData as Record<string, number>) || {};
  return {
    valid: rawCounts.valid || 0,
    incomplete: rawCounts.incomplete || 0,
    error: rawCounts.error || 0,
    duplicate_db: rawCounts.duplicate_db || 0,
    duplicate_file: rawCounts.duplicate_file || 0,
    total: totalRows,
  };
}
