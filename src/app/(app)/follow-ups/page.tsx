'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Clock,
  Bell,
  Calendar,
  AlertCircle,
  Hourglass,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useFollowUpQueue } from '@/features/follow-ups/queries';
import { FollowUpSection } from '@/features/follow-ups/components/FollowUpSection';
import { InboxZero } from '@/features/follow-ups/components/InboxZero';
import { Progress } from '@/components/ui/progress';
import { ExportButton, createFollowUpsExportSpec } from '@/features/data-hub/export';

export default function FollowUpsPage() {
  const t = useTranslations('followUps');
  const { grouped, isLoading, isError, refetch } = useFollowUpQueue();
  const followUpsExportSpec = React.useMemo(() => createFollowUpsExportSpec(), []);

  const {
    due_fu1,
    due_fu2,
    due_fu3,
    reminder,
    meeting_today,
    exhausted,
    waiting,
    totalDue,
    waitingTotal,
    nextDueAfterZero,
  } = grouped;

  // Track maximum due count seen this session for progress calculation
  const [sessionPeak, setSessionPeak] = React.useState(totalDue);
  const [prevTotalDue, setPrevTotalDue] = React.useState(totalDue);
  if (totalDue !== prevTotalDue) {
    setPrevTotalDue(totalDue);
    if (totalDue > sessionPeak) {
      setSessionPeak(totalDue);
    }
  }

  // Update document.title with (N) prefix
  React.useEffect(() => {
    const baseTitle = `${t('title')} · Scope CRM`;
    if (totalDue > 0) {
      document.title = `(${totalDue}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [totalDue, t]);

  const maxTotal = Math.max(sessionPeak, totalDue);
  const doneCount = Math.max(0, maxTotal - totalDue);
  const progressPercent = maxTotal > 0 ? Math.round((doneCount / maxTotal) * 100) : 100;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="text-sm font-medium">جارِ تحميل طابور المتابعات…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-4">
        <h2 className="text-lg font-bold text-destructive">تعذر تحميل المتابعات</h2>
        <p className="text-sm text-muted-foreground">
          حدث خطأ أثناء تحميل البيانات، يرجى المحاولة مرة أخرى.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="px-4 py-2 text-sm font-medium rounded-full border border-border bg-card text-foreground hover:bg-muted/40 shadow-2xs transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4 sm:px-6">
      {/* Relate Header & Animated Session Progress Bar */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {t('title')}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {totalDue > 0
                ? t('todayProgress', { count: totalDue })
                : t('todayProgressZero')}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ExportButton spec={followUpsExportSpec} />
            {doneCount > 0 && maxTotal > 0 && (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-2xs">
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                <span>{t('doneCount', { done: doneCount, total: maxTotal })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Visual Progress Bar in Relate Design System */}
        {maxTotal > 0 && (
          <div className="space-y-1.5 p-3 rounded-2xl bg-card border border-border shadow-2xs">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground px-1">
              <span>نسبة إنجاز اليوم</span>
              <span className="font-mono font-bold text-primary">
                {progressPercent}%
              </span>
            </div>
            <Progress value={progressPercent} className="h-2.5 rounded-full bg-muted" />
          </div>
        )}
      </div>

      {/* Main Content: InboxZero or Sections */}
      {totalDue === 0 ? (
        <InboxZero nextDueAt={nextDueAfterZero} />
      ) : (
        <div className="space-y-6">
          {/* 1. Due Sub-group: Follow-up 1 */}
          <FollowUpSection
            title={t('sections.dueFu1')}
            count={due_fu1.length}
            items={due_fu1}
            icon={Clock}
            dotColor="bg-[#ffa64d]"
          />

          {/* 2. Due Sub-group: Follow-up 2 */}
          <FollowUpSection
            title={t('sections.dueFu2')}
            count={due_fu2.length}
            items={due_fu2}
            icon={Clock}
            dotColor="bg-[#f59e0b]"
          />

          {/* 3. Due Sub-group: Follow-up 3 */}
          <FollowUpSection
            title={t('sections.dueFu3')}
            count={due_fu3.length}
            items={due_fu3}
            icon={Clock}
            dotColor="bg-[#d97706]"
          />

          {/* 4. Reminders */}
          <FollowUpSection
            title={t('sections.reminders')}
            count={reminder.length}
            items={reminder}
            icon={Bell}
            dotColor="bg-[#145aff]"
          />

          {/* 5. Meetings Today */}
          <FollowUpSection
            title={t('sections.meetingsToday')}
            count={meeting_today.length}
            items={meeting_today}
            icon={Calendar}
            dotColor="bg-[#3b82f6]"
          />

          {/* 6. Exhausted (Completed 3 FU) */}
          <FollowUpSection
            title={t('sections.exhausted')}
            count={exhausted.length}
            items={exhausted}
            icon={AlertCircle}
            dotColor="bg-[#f26052]"
          />
        </div>
      )}

      {/* 7. Waiting Queue (Collapsed by default, shows total count) */}
      <div className="pt-6 border-t border-border">
        <FollowUpSection
          title={t('sections.waiting')}
          count={waitingTotal}
          items={waiting}
          icon={Hourglass}
          defaultOpen={false}
          isCollapsible
          dotColor="bg-slate-400"
          viewAllUrl="/leads?stages=message_sent,follow_up_1,follow_up_2,follow_up_3"
        />
      </div>
    </div>
  );
}
