'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { ExportButton } from '@/features/data-hub/export';
import type { DashboardRange, RawDashboardStats } from '../types';
import { DashboardStatsSchema } from '../types';
import { computeDateRange } from '../range';
import { RangePicker } from './RangePicker';
import { DueTodayCard } from './DueTodayCard';
import { KpiGrid } from './KpiGrid';
import { PipelineBar } from './PipelineBar';
import { FirstRunOnboardingCard } from './FirstRunOnboardingCard';
import { createDashboardExportSpec } from '../export-spec';

export function DashboardView() {
  const searchParams = useSearchParams();
  const rangeParam = (searchParams.get('range') as DashboardRange) || '30d';
  const validRanges: DashboardRange[] = ['today', '7d', '30d', 'this_month', 'all'];
  const currentRange = validRanges.includes(rangeParam) ? rangeParam : '30d';

  const dateRange = computeDateRange(currentRange);
  const supabase = createClient();

  const { data: stats, isLoading, error, refetch, isFetching } = useQuery<RawDashboardStats>({
    queryKey: ['dashboard_stats', currentRange, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data, error: rpcErr } = await supabase.rpc('dashboard_stats', {
        p_from: dateRange.from,
        p_to: dateRange.to,
      });

      if (rpcErr) throw rpcErr;
      return DashboardStatsSchema.parse(data);
    },
    staleTime: 60 * 1000,
  });

  const exportSpec = stats
    ? createDashboardExportSpec(stats, dateRange.labelAr)
    : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="size-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              لوحة المؤشرات والتحليلات
            </h1>
            {isFetching && (
              <RefreshCw className="size-3.5 text-muted-foreground animate-spin ms-1" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            متابعة دقيقة للأداء، حركة المبيعات، ونسب التحويل خلال {dateRange.labelAr}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <RangePicker currentRange={currentRange} />
          {exportSpec && <ExportButton spec={exportSpec} size="sm" />}
        </div>
      </div>

      {/* Due Today Priority Callout */}
      <DueTodayCard />

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-muted/60" />
            ))}
          </div>
          <div className="h-44 rounded-2xl bg-muted/60" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-6 rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive text-xs space-y-3">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="size-4" />
            <span>فشل تحميل إحصائيات لوحة التحكم</span>
          </div>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء استرجاع البيانات'}
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs">
            إعادة المحاولة
          </Button>
        </div>
      )}

      {/* Content */}
      {stats && (
        <>
          {/* First run onboarding banner (if 0 leads) */}
          <FirstRunOnboardingCard totalLeads={stats.total_leads} />

          {/* KPI Grid */}
          <KpiGrid stats={stats} />

          {/* Pipeline Breakdown Bar */}
          <PipelineBar pipeline={stats.pipeline} totalLeads={stats.total_leads} />
        </>
      )}
    </div>
  );
}
