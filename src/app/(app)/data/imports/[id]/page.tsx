'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode, demoStore } from '@/lib/demo/demo-store';
import type { ImportJob, ImportRowStatus, CountryRef, IndustryRef } from '@/features/data-hub/import/types';
import { ReportSummaryCards } from '@/features/data-hub/import/components/ReportSummaryCards';
import { ReportRowsTable } from '@/features/data-hub/import/components/ReportRowsTable';
import { CommitModal } from '@/features/data-hub/import/components/CommitModal';

export default function ImportReportPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [activeFilter, setActiveFilter] = React.useState<ImportRowStatus | 'all'>('all');
  const [showCommitModal, setShowCommitModal] = React.useState(false);

  const supabase = createClient();

  // 1. Fetch import job
  const { data: job, isLoading, refetch } = useQuery({
    queryKey: ['import_job', jobId],
    queryFn: async () => {
      if (isDemoMode() && jobId?.startsWith('demo-job-')) {
        return {
          id: jobId,
          source: 'xlsx',
          file_name: 'demo-import.xlsx',
          sheet_name: 'Sheet1',
          mapping: {},
          options: {},
          total_rows: 50,
          status: 'ready',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as unknown as ImportJob;
      }
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      if (error) throw error;
      return data as unknown as ImportJob;
    },
    enabled: Boolean(jobId),
  });

  // 2. Fetch references
  const { data: industries = [] } = useQuery<IndustryRef[]>({
    queryKey: ['industries', 'active'],
    queryFn: async () => {
      if (isDemoMode()) {
        return demoStore.getIndustries().filter((i) => i.is_active).map((i) => ({
          id: i.id,
          key: i.key,
          label_ar: i.label_ar,
          label_en: i.label_en,
        }));
      }
      const { data } = await supabase
        .from('industries')
        .select('id, key, label_ar, label_en')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      return (data || []) as IndustryRef[];
    },
  });

  const { data: countries = [] } = useQuery<CountryRef[]>({
    queryKey: ['countries'],
    queryFn: async () => {
      if (isDemoMode()) {
        return demoStore.getCountries().map((c) => ({
          code: c.code,
          name_ar: c.name_ar,
          name_en: c.name_en,
        }));
      }
      const { data } = await supabase
        .from('countries')
        .select('code, name_ar, name_en')
        .order('name_ar', { ascending: true });
      return (data || []) as CountryRef[];
    },
  });

  // 3. Count rows by decision
  const { data: decisionCounts, refetch: refetchDecisions } = useQuery({
    queryKey: ['import_decision_counts', jobId],
    queryFn: async () => {
      if (isDemoMode() && jobId?.startsWith('demo-job-')) {
        return {
          insertCount: 50,
          updateCount: 0,
          skipCount: 0,
          totalToCommit: 50,
        };
      }
      const { data: rows } = await supabase
        .from('import_rows')
        .select('decision, status')
        .eq('job_id', jobId);

      let insertCount = 0;
      let updateCount = 0;
      let skipCount = 0;

      for (const r of rows || []) {
        if (r.decision === 'import') insertCount++;
        else if (r.decision === 'update') updateCount++;
        else skipCount++;
      }

      return {
        insertCount,
        updateCount,
        skipCount,
        totalToCommit: insertCount + updateCount,
      };
    },
    enabled: Boolean(jobId),
  });

  const handleBulkDecision = async (status: ImportRowStatus, decision: 'import' | 'skip' | 'update') => {
    await supabase.rpc('set_import_decisions', {
      p_job: jobId,
      p_status: status,
      p_decision: decision,
    });
    refetch();
    refetchDecisions();
  };

  const handleRowUpdated = () => {
    refetch();
    refetchDecisions();
  };

  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-16 text-center space-y-3">
        <Loader2 className="size-8 animate-spin text-primary mx-auto" />
        <p className="text-xs text-muted-foreground font-medium">جارِ تحميل تقرير الاستيراد…</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container max-w-5xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="text-lg font-bold text-foreground">لم يتم العثور على مهمة الاستيراد</h2>
        <Button onClick={() => router.push('/data')} variant="outline" size="sm">
          العودة لمركز البيانات
        </Button>
      </div>
    );
  }

  const counts = (job.counts as Record<string, number>) || {};
  const insertCount = decisionCounts?.insertCount || 0;
  const updateCount = decisionCounts?.updateCount || 0;
  const skipCount = decisionCounts?.skipCount || 0;
  const totalToCommit = decisionCounts?.totalToCommit || 0;

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="cursor-pointer hover:underline" onClick={() => router.push('/data')}>
              مركز البيانات
            </span>
            <span>/</span>
            <span>تقرير استيراد الملف</span>
          </div>
          <h1 className="text-xl font-black text-foreground flex items-center gap-2.5">
            <FileSpreadsheet className="size-5 text-primary" />
            <span>{job.file_name || 'ملف بيانات العملاء'}</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            تاريخ الفحص: {new Date(job.created_at).toLocaleString('ar-EG')} · الصفحة: {job.sheet_name || 'افتراضية'}
          </p>
        </div>

        {/* Primary CTA Button */}
        <div className="flex items-center gap-2">
          <Button
            size="lg"
            onClick={() => setShowCommitModal(true)}
            disabled={totalToCommit === 0 || job.status === 'done'}
            className="font-bold shadow-md px-6"
          >
            <ShieldCheck className="size-4 me-2" />
            {job.status === 'done'
              ? 'تم استيراد هذا الملف بالكامل'
              : `اعتماد واستيراد (${totalToCommit.toLocaleString()} عميل)`}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <ReportSummaryCards
        counts={counts}
        totalRows={job.total_rows}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Bulk Action Controls */}
      <div className="p-3.5 rounded-2xl border border-border bg-card flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="font-bold text-foreground">إجراءات سريعة:</span>
          <span>تطبيق قرارات جماعية على الصفوف</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(counts.incomplete ?? 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkDecision('incomplete', 'skip')}
              className="text-xs h-8"
            >
              تخطي جميع الصفوف غير المكتملة
            </Button>
          )}

          {(counts.duplicate_db ?? 0) > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkDecision('duplicate_db', 'update')}
                className="text-xs h-8 text-purple-600 dark:text-purple-400"
              >
                تحديث جميع المكررات في النظام
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkDecision('duplicate_db', 'skip')}
                className="text-xs h-8"
              >
                تخطي جميع المكررات
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Rows Table */}
      <ReportRowsTable
        jobId={jobId}
        statusFilter={activeFilter}
        countries={countries}
        industries={industries}
        onRowUpdated={handleRowUpdated}
      />

      {/* Commit Modal */}
      {showCommitModal && (
        <CommitModal
          jobId={jobId}
          totalToCommit={totalToCommit}
          insertCount={insertCount}
          updateCount={updateCount}
          skipCount={skipCount}
          onClose={() => setShowCommitModal(false)}
          onComplete={() => {
            refetch();
            refetchDecisions();
          }}
        />
      )}
    </div>
  );
}
