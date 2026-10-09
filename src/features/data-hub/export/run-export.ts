import * as Comlink from 'comlink';
import { AppError } from '@/lib/errors';
import type { ExportSpec, ExportWorkerApi, SerializableSpec } from './types';

export interface RunExportOptions {
  format: 'xlsx' | 'csv';
  locale: 'ar' | 'en';
  selectedColumns?: string[];
  onProgress?: (progress: { processed: number; total: number; percent: number }) => void;
  signal?: AbortSignal;
}

/**
 * Triggers a native file download in the browser.
 */
export function triggerFileDownload(
  buffer: ArrayBuffer,
  fileName: string,
  format: 'xlsx' | 'csv'
): void {
  const mimeType =
    format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : fileName.endsWith('.zip')
        ? 'application/zip'
        : 'text/csv;charset=utf-8';

  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Executes a full export using the background Web Worker.
 */
export async function runExport<Row = Record<string, unknown>>(
  spec: ExportSpec<Row>,
  options: RunExportOptions
): Promise<void> {
  const { format, locale, selectedColumns, onProgress, signal } = options;

  if (signal?.aborted) {
    throw new AppError('CANCELLED');
  }

  // Instantiate worker
  const worker = new Worker(
    new URL('./export.worker.ts', import.meta.url),
    { type: 'module' }
  );

  const api = Comlink.wrap<ExportWorkerApi>(worker);
  let isAborted = false;

  const cleanup = () => {
    worker.terminate();
  };

  if (signal) {
    signal.addEventListener('abort', () => {
      isAborted = true;
      cleanup();
    });
  }

  try {
    // 1. Prepare serializable spec with filtered columns
    const serializableSpec: SerializableSpec = {
      sheets: spec.sheets.map((sheet) => {
        const filteredCols = selectedColumns
          ? sheet.columns.filter((c) => selectedColumns.includes(c.key))
          : sheet.columns;

        return {
          name: sheet.name[locale],
          columns: filteredCols.map((c) => ({
            key: c.key,
            header: c.header[locale],
            width: c.width || 18,
            format: c.format || 'text',
          })),
        };
      }),
    };

    // 2. Initialize worker
    await api.begin(serializableSpec, locale, format);

    let totalProcessed = 0;
    let estimatedTotal = 0;

    // 3. Page through sheets and fetch data
    for (const sheet of spec.sheets) {
      if (isAborted || signal?.aborted) throw new AppError('CANCELLED');

      const sheetName = sheet.name[locale];
      const activeColumns = selectedColumns
        ? sheet.columns.filter((c) => selectedColumns.includes(c.key))
        : sheet.columns;

      let cursor: string | number | null = null;
      let hasMore = true;

      while (hasMore) {
        if (isAborted || signal?.aborted) throw new AppError('CANCELLED');

        const pageResult = await sheet.fetchPage(cursor);
        const { rows, nextCursor, totalCount } = pageResult;

        if (totalCount && totalCount > estimatedTotal) {
          estimatedTotal = totalCount;
        }

        if (rows.length > 0) {
          // Map row objects according to column definitions
          const mappedRows = rows.map((row) => {
            const mapped: Record<string, unknown> = {};
            for (const col of activeColumns) {
              mapped[col.key] = col.getValue ? col.getValue(row) : (row as Record<string, unknown>)[col.key];
            }
            return mapped;
          });

          await api.addRows(sheetName, mappedRows);
          totalProcessed += rows.length;

          const denom = Math.max(estimatedTotal, totalProcessed);
          const percent = denom > 0 ? Math.min(99, Math.round((totalProcessed / denom) * 100)) : 50;

          onProgress?.({
            processed: totalProcessed,
            total: denom,
            percent,
          });
        }

        if (!nextCursor || rows.length === 0) {
          hasMore = false;
        } else {
          cursor = nextCursor;
        }
      }
    }

    if (isAborted || signal?.aborted) throw new AppError('CANCELLED');

    onProgress?.({
      processed: totalProcessed,
      total: totalProcessed,
      percent: 100,
    });

    // 4. Finish and retrieve buffer
    const arrayBuffer = await api.finish();

    // 5. Trigger download
    const isMultiSheetCsv = format === 'csv' && spec.sheets.length > 1;
    const extension = format === 'xlsx' ? 'xlsx' : isMultiSheetCsv ? 'zip' : 'csv';
    const finalFileName = `${spec.fileName}.${extension}`;

    triggerFileDownload(arrayBuffer, finalFileName, format);
  } finally {
    cleanup();
  }
}
