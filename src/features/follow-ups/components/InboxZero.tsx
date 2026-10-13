'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Calendar } from 'lucide-react';

export interface InboxZeroProps {
  nextDueAt?: string | null;
}

export function InboxZero({ nextDueAt }: InboxZeroProps) {
  const t = useTranslations('followUps');

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-3xl border border-border bg-card shadow-2xs space-y-4">
      {/* Relate Emerald Celebration Halo */}
      <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-8 ring-emerald-500/10">
        <CheckCircle2 className="size-9 stroke-[2.2]" />
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
          {t('inboxZeroTitle')}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {t('inboxZeroDesc')}
        </p>
      </div>

      {nextDueAt ? (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-xs font-semibold text-primary border border-primary/20 shadow-2xs">
          <Calendar className="size-3.5" />
          <span>{t('nextDueAt', { date: nextDueAt })}</span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t('noUpcoming')}
        </p>
      )}
    </div>
  );
}
