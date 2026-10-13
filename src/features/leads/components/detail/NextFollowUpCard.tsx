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
        'p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-2xs space-y-4',
        className
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-border pb-3.5">
        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Clock className="size-4" />
        </div>
        <h2 className="text-base font-extrabold tracking-tight text-foreground">
          {t('nextFollowUpCardTitle')}
        </h2>
      </div>

      {lead.next_follow_up_on ? (
        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-primary/10 border border-primary/20">
          <div className="size-9 rounded-full bg-card shadow-2xs flex items-center justify-center shrink-0">
            <Calendar className="size-4.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">موعد الاستحقاق:</span>
            <span className="text-sm font-bold text-foreground">
              {formattedDate} <span className="text-xs font-mono font-normal text-muted-foreground">({lead.next_follow_up_on})</span>
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-1">
          {t('noFollowUpScheduled')}
        </p>
      )}
    </div>
  );
}
