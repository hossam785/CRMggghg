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
      className={`rounded-2xl border border-border bg-card p-5 md:p-6 shadow-2xs ${
        className || ''
      }`}
    >
      <div className="flex items-center gap-2.5 pb-3.5 mb-6 border-b border-border">
        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <History className="size-4" />
        </div>
        <h3 className="text-base font-extrabold tracking-tight text-foreground">
          {t('timeline.title')}
        </h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span className="text-sm font-medium">{t('common.loading')}</span>
        </div>
      ) : !events || events.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          {t('timeline.empty')}
        </div>
      ) : (
        <div className="relative before:absolute before:top-3 before:bottom-3 before:start-[15px] before:w-[2px] before:bg-border">
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
