'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lead } from '../../schema';

export interface NextFollowUpCardProps {
  lead: Lead;
  className?: string;
}

export function NextFollowUpCard({ lead, className }: NextFollowUpCardProps) {
  const t = useTranslations('leads');
  const locale = useLocale();

  const formattedDate = React.useMemo(() => {
    if (!lead.next_follow_up_on) return null;
    const d = new Date(lead.next_follow_up_on);
    return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [lead.next_follow_up_on, locale]);

  return (
    <div
      className={cn(
        'p-5 sm:p-6 rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3',
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
        <Clock className="size-4 text-[var(--primary)]" />
        <h2 className="text-base font-bold text-[var(--fg)]">
          {t('nextFollowUpCardTitle')}
        </h2>
      </div>

      {lead.next_follow_up_on ? (
        <div className="flex items-center gap-3 p-3.5 rounded-[var(--radius-lg)] bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
          <Calendar className="size-5 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs text-[var(--fg-muted)]">موعد الاستحقاق:</span>
            <span className="text-sm font-semibold text-[var(--fg)]">
              {formattedDate} ({lead.next_follow_up_on})
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--fg-muted)] py-2">
          {t('noFollowUpScheduled')}
        </p>
      )}
    </div>
  );
}
