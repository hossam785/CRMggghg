'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';
import type { ImportWorkerApi, Mapping, SheetData, ValidateCtx } from '../types';
import type { Json } from '@/types/database';
import { runStaging } from '../run-staging';
import { clearPendingImport, savePendingImport } from '../resume';

interface StagingStepProps {
  workerApi: ImportWorkerApi;
  fileOrBuffer: File | ArrayBuffer;
  fileName: string;
  sheetName: string;
  sheetData: SheetData;
  mapping: Mapping;
  ctx: ValidateCtx;
  onCancel: () => void;
}

export function StagingStep({
  workerApi,
  fileOrBuffer,
  fileName,
  sheetName,
  sheetData,
  mapping,
  ctx,
  onCancel,
}: StagingStepProps) {
  const router = useRouter();
  const [phase, setPhase] = React.useState<'validating' | 'uploading' | 'finalizing' | 'done'>('validating');
  const [progress, setProgress] = React.useState<number>(0);
  const [error, setError] = React.useState<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    async function execute() {
      try {
        const supabase = createClient();

        // 1. Client-side validation in Worker
        setPhase('validating');
        await workerApi.validateAll(
          mapping,
          ctx,
          (done, total) => {
            if (!isMounted) return;
            const pct = total > 0 ? Math.round((done / total) * 50) : 0;
            setProgress(pct);
          }
        );

        if (controller.signal.aborted) return;

        // 2. Create import_jobs record in DB
        const { data: jobData, error: jobErr } = await supabase
          .from('import_jobs')
          .insert({
            source: fileName.endsWith('.csv') ? 'csv' : 'xlsx',
            file_name: fileName,
            sheet_name: sheetName,
            mapping: mapping as unknown as Json,
            options: ctx as unknown as Json,
            total_rows: sheetData.totalRows,
            status: 'staging',
          })
          .select('id')
          .single();

        if (jobErr || !jobData) {
          throw new Error(jobErr?.message || 'فشل إنشاء مهمة الاستيراد في قاعدة البيانات');
        }

        const jobId = jobData.id;

        // 3. Save to IndexedDB for resumability
        await savePendingImport(
          {
            jobId,
            fileName,
            sheetName,
            mapping,
            ctx,
            totalRows: sheetData.totalRows,
            stagedRows: 0,
            cachedAt: new Date().toISOString(),
          },
          fileOrBuffer
        );

        // 4. Batched Staging Upload
        setPhase('uploading');
        await runStaging({
          workerApi,
          jobId,
          totalRows: sheetData.totalRows,
          startRowIdx: 0,
          supabase,
          signal: controller.signal,
          onProgress: (staged, total) => {
            if (!isMounted) return;
            // Map 50% to 100%
            const pct = 50 + (total > 0 ? Math.round((staged / total) * 50) : 0);
            setProgress(pct);
          },
        });

        if (controller.signal.aborted) return;

        // 5. Done staging! Clear pending cache and navigate to Review Report
        setPhase('done');
        await clearPendingImport(jobId);
        router.push(`/data/imports/${jobId}`);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg !== 'Import was cancelled' && msg !== 'CANCELLED') {
          setError(msg || 'حدث خطأ أثناء فحص ورفع البيانات');
        }
      }
    }

    execute();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [workerApi, fileName, sheetName, sheetData.totalRows, mapping, ctx, router, fileOrBuffer]);

  const handleAbort = () => {
    abortControllerRef.current?.abort();
    onCancel();
  };

  return (
    <div className="p-8 rounded-2xl border border-border bg-card max-w-xl mx-auto space-y-6 text-center">
      <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
        <Loader2 className="size-8 animate-spin" />
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-bold text-foreground">
          {phase === 'validating' && 'جارِ تدقيق وتجهيز البيانات في الـ Web Worker…'}
          {phase === 'uploading' && 'جارِ رفع الصفوف إلى خادم التخزين المؤقت…'}
          {phase === 'done' && 'اكتملت المعالجة، جارِ الانتقال إلى التقرير…'}
        </h3>
        <p className="text-xs text-muted-foreground">
          {sheetData.totalRows.toLocaleString()} صف في الملف · لا تغلق هذه النافذة
        </p>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2.5 rounded-full" />
        <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
          <span>{progress}%</span>
          <span>{sheetData.totalRows.toLocaleString()} صفوف</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs text-start flex items-start gap-3">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">فشل أثناء معالجة الملف:</div>
            <div className="mt-1">{error}</div>
          </div>
        </div>
      )}

      <div className="pt-2">
        <Button variant="outline" size="sm" onClick={handleAbort} className="text-destructive hover:bg-destructive/10">
          <XCircle className="size-4 me-1.5" />
          إلغاء العملية
        </Button>
      </div>
    </div>
  );
}
