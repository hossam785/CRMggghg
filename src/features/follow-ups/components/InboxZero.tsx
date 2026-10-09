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
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-2xs space-y-4">
      <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
        <CheckCircle2 className="size-8 stroke-[2.2]" />
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-lg font-bold text-[var(--fg)]">
          {t('inboxZeroTitle')}
        </h3>
        <p className="text-sm text-[var(--fg-muted)]">
          {t('inboxZeroDesc')}
        </p>
      </div>

      {nextDueAt ? (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-2)] text-xs font-medium text-[var(--fg-muted)] border border-[var(--border)]">
          <Calendar className="size-3.5 text-[var(--primary)]" />
          <span>{t('nextDueAt', { date: nextDueAt })}</span>
        </div>
      ) : (
        <p className="text-xs text-[var(--fg-muted)]">
          {t('noUpcoming')}
        </p>
      )}
    </div>
  );
}
