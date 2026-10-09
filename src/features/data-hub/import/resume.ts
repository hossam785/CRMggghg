import { get, set, del, keys } from 'idb-keyval';
import type { Mapping, ValidateCtx } from './types';

export interface PendingImportJob {
  jobId: string;
  fileName: string;
  sheetName: string;
  mapping: Mapping;
  ctx: ValidateCtx;
  totalRows: number;
  stagedRows: number;
  cachedAt: string;
}

const PREFIX = 'scope_pending_import_';
const FILE_PREFIX = 'scope_import_file_';

export async function savePendingImport(
  job: PendingImportJob,
  fileOrBuffer?: File | ArrayBuffer
): Promise<void> {
  try {
    await set(`${PREFIX}${job.jobId}`, job);
    if (fileOrBuffer) {
      await set(`${FILE_PREFIX}${job.jobId}`, fileOrBuffer);
    }
  } catch {
    // Ignore IndexedDB save failure
  }
}

export async function getPendingImport(
  jobId: string
): Promise<{ job: PendingImportJob; file?: File | ArrayBuffer } | null> {
  try {
    const job = await get<PendingImportJob>(`${PREFIX}${jobId}`);
    if (!job) return null;
    const file = await get<File | ArrayBuffer>(`${FILE_PREFIX}${jobId}`);
    return { job, file };
  } catch {
    return null;
  }
}

export async function listPendingImports(): Promise<PendingImportJob[]> {
  try {
    const allKeys = await keys();
    const jobKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(PREFIX)) as string[];
    const list: PendingImportJob[] = [];
    for (const k of jobKeys) {
      const item = await get<PendingImportJob>(k);
      if (item) list.push(item);
    }
    return list;
  } catch {
    return [];
  }
}

export async function clearPendingImport(jobId: string): Promise<void> {
  try {
    await del(`${PREFIX}${jobId}`);
    await del(`${FILE_PREFIX}${jobId}`);
  } catch {
    // Ignore IndexedDB clear failure
  }
}
