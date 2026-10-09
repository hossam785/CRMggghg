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

export default function FollowUpsPage() {
  const t = useTranslations('followUps');
  const { grouped, isLoading, isError, refetch } = useFollowUpQueue();

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
  const [sessionPeak, setSessionPeak] = React.useState(0);
  if (totalDue > sessionPeak) {
    setSessionPeak(totalDue);
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-[var(--fg-muted)] gap-3">
        <Loader2 className="size-8 animate-spin text-[var(--primary)]" />
        <span className="text-sm font-medium">جارِ تحميل طابور المتابعات…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--danger)]">تعذر تحميل المتابعات</h2>
        <p className="text-sm text-[var(--fg-muted)]">
          حدث خطأ أثناء تحميل البيانات، يرجى المحاولة مرة أخرى.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--fg)] hover:bg-[var(--border)] transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4 sm:px-6">
      {/* Header & Progress Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)] sm:text-3xl">
              {t('title')}
            </h1>
            <p className="text-sm text-[var(--fg-muted)] mt-1">
              {totalDue > 0
                ? t('todayProgress', { count: totalDue })
                : t('todayProgressZero')}
            </p>
          </div>

          {doneCount > 0 && maxTotal > 0 && (
            <div className="inline-flex items-center gap-1.5 text-xs text-[var(--fg-muted)] bg-[var(--surface-2)] px-2.5 py-1 rounded-full border border-[var(--border)]">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              <span>{t('doneCount', { done: doneCount, total: maxTotal })}</span>
            </div>
          )}
        </div>

        {/* Visual Progress Bar */}
        {maxTotal > 0 && (
          <div className="space-y-1.5">
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}
      </div>

      {/* Main Content: InboxZero or Sections */}
      {totalDue === 0 ? (
        <InboxZero nextDueAt={nextDueAfterZero} />
      ) : (
        <div className="space-y-8">
          {/* 1. Due Sub-group: Follow-up 1 */}
          <FollowUpSection
            title={t('sections.dueFu1')}
            count={due_fu1.length}
            items={due_fu1}
            icon={Clock}
          />

          {/* 2. Due Sub-group: Follow-up 2 */}
          <FollowUpSection
            title={t('sections.dueFu2')}
            count={due_fu2.length}
            items={due_fu2}
            icon={Clock}
          />

          {/* 3. Due Sub-group: Follow-up 3 */}
          <FollowUpSection
            title={t('sections.dueFu3')}
            count={due_fu3.length}
            items={due_fu3}
            icon={Clock}
          />

          {/* 4. Reminders */}
          <FollowUpSection
            title={t('sections.reminders')}
            count={reminder.length}
            items={reminder}
            icon={Bell}
          />

          {/* 5. Meetings Today */}
          <FollowUpSection
            title={t('sections.meetingsToday')}
            count={meeting_today.length}
            items={meeting_today}
            icon={Calendar}
          />

          {/* 6. Exhausted (Completed 3 FU) */}
          <FollowUpSection
            title={t('sections.exhausted')}
            count={exhausted.length}
            items={exhausted}
            icon={AlertCircle}
          />
        </div>
      )}

      {/* 7. Waiting Queue (Collapsed by default, shows total count) */}
      <div className="pt-4 border-t border-[var(--border)]">
        <FollowUpSection
          title={t('sections.waiting')}
          count={waitingTotal}
          items={waiting}
          icon={Hourglass}
          defaultOpen={false}
          isCollapsible
          viewAllUrl="/leads?stages=message_sent,follow_up_1,follow_up_2,follow_up_3"
        />
      </div>
    </div>
  );
}
