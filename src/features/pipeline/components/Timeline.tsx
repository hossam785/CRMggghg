'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { History, Loader2 } from 'lucide-react';
import { TimelineItem } from './TimelineItem';
import { useLeadEvents } from '../queries';

export interface TimelineProps {
  leadId: string;
  className?: string;
}

export function Timeline({ leadId, className }: TimelineProps) {
  const t = useTranslations();
  const { data: events, isLoading } = useLeadEvents(leadId);

  return (
    <div
      className={`rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6 ${
        className || ''
      }`}
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="flex size-7 items-center justify-center rounded-md bg-[var(--surface-2)] text-[var(--fg)]">
          <History className="size-4" />
        </div>
        <h3 className="text-base font-bold text-[var(--fg)]">
          {t('timeline.title')}
        </h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-[var(--fg-muted)] gap-2">
          <Loader2 className="size-5 animate-spin text-[var(--primary)]" />
          <span className="text-sm">{t('common.loading')}</span>
        </div>
      ) : !events || events.length === 0 ? (
        <div className="text-center py-8 text-sm text-[var(--fg-muted)]">
          {t('timeline.empty')}
        </div>
      ) : (
        <div className="relative before:absolute before:top-3 before:bottom-3 before:start-[15px] before:w-[2px] before:bg-[var(--border)]">
          {events.map((event, index) => (
            <TimelineItem
              key={event.id}
              event={event}
              isLatest={index === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
