'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Clock,
  RotateCcw,
  ExternalLink,
  Loader2,
  CheckCircle2,
  FileUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { ImportJob } from '@/features/data-hub/import/types';
import { runRollback } from '@/features/data-hub/import/run-commit';

export default function ImportsHistoryPage() {
  const supabase = createClient();
  const [rollingBackId, setRollingBackId] = React.useState<string | null>(null);
  const [now] = React.useState(() => Date.now());

  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['import_jobs_history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ImportJob[];
    },
  });

  const handleRollback = async (jobId: string) => {
    if (!confirm('هل أنت متأكد من التراجع عن هذا الاستيراد بالكامل؟ سيتم حذف العملاء المضافين واستعادة القيم السابقة.')) {
      return;
    }

    setRollingBackId(jobId);
    try {
      await runRollback(jobId, supabase);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'فشل التراجع عن الاستيراد');
    } finally {
      setRollingBackId(null);
    }
  };

  const isEligibleForRollback = (job: ImportJob) => {
    if (job.status !== 'done' || !job.finished_at) return false;
    const finished = new Date(job.finished_at).getTime();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    return finished >= sevenDaysAgo;
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Link href="/data" className="hover:underline">
              مركز البيانات
            </Link>
            <span>/</span>
            <span>سجل عمليات الاستيراد</span>
          </div>
          <h1 className="text-xl font-black text-foreground">سجل استيراد الملفات</h1>
          <p className="text-xs text-muted-foreground">
            جميع الملفات التي تم استيرادها سابقًا مع إمكانية مراجعة التقارير أو التراجع عنها خلال 7 أيام.
          </p>
        </div>

        <Button asChild size="sm" className="font-bold">
          <Link href="/data/import">
            <FileUp className="size-4 me-1.5" />
            استيراد ملف جديد
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="size-8 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground">جارِ تحميل سجل الاستيراد…</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
          <FileSpreadsheet className="size-10 text-muted-foreground/40 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">لا توجد عمليات استيراد سابقة</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            يمكنك استيراد جهات الاتصال من ملفات Excel و CSV وسيقوم النظام بتسجيلها هنا تلقائيًا.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href="/data/import">بدء أول استيراد</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="divide-y divide-border">
            {jobs.map((job) => {
              const eligibleRollback = isEligibleForRollback(job);
              const isRollingBackThis = rollingBackId === job.id;

              return (
                <div
                  key={job.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-accent/20 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {job.file_name || 'ملف بيانات'}
                      </span>
                      {job.status === 'done' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                          <CheckCircle2 className="size-3" />
                          <span>مكتمل</span>
                        </span>
                      )}
                      {job.status === 'review' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">
                          <Clock className="size-3" />
                          <span>بانتظار الاعتماد</span>
                        </span>
                      )}
                      {job.status === 'rolled_back' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                          <RotateCcw className="size-3" />
                          <span>تم التراجع</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                      <span>{new Date(job.created_at).toLocaleString('ar-EG')}</span>
                      <span>·</span>
                      <span>إجمالي الصفوف: {job.total_rows.toLocaleString()}</span>
                      {job.committed_rows > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-primary font-bold">
                            تم اعتماد: {job.committed_rows.toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/data/imports/${job.id}`}>
                        <ExternalLink className="size-3.5 me-1.5" />
                        عرض التقرير
                      </Link>
                    </Button>

                    {eligibleRollback && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isRollingBackThis}
                        onClick={() => handleRollback(job.id)}
                        className="text-destructive hover:bg-destructive/10 text-xs"
                      >
                        <RotateCcw className="size-3.5 me-1.5" />
                        {isRollingBackThis ? 'جارِ التراجع…' : 'تراجع (Rollback)'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
