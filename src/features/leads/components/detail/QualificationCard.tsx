'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SaveIndicator } from '@/components/ui/save-indicator';
import { TriStateToggle } from '../fields/TriStateToggle';
import { useAutosaveField } from '../../use-autosave-field';
import { cn } from '@/lib/utils';
import type { Lead } from '../../schema';

export interface QualificationCardProps {
  lead: Lead;
  className?: string;
}

export function QualificationCard({ lead, className }: QualificationCardProps) {
  const t = useTranslations('leads');

  const contentAutosave = useAutosaveField({
    leadId: lead.id,
    field: 'has_content',
    initialValue: lead.has_content,
    currentLead: lead,
    debounceMs: 0,
  });

  const appearsAutosave = useAutosaveField({
    leadId: lead.id,
    field: 'appears_in_content',
    initialValue: lead.appears_in_content,
    currentLead: lead,
    debounceMs: 0,
  });

  const videographerAutosave = useAutosaveField({
    leadId: lead.id,
    field: 'has_videographer',
    initialValue: lead.has_videographer || 'unknown',
    currentLead: lead,
    debounceMs: 0,
  });

  const problemsAutosave = useAutosaveField({
    leadId: lead.id,
    field: 'problems',
    initialValue: lead.problems,
    currentLead: lead,
    debounceMs: 600,
  });

  const remainingChars = 280 - (problemsAutosave.value?.length || 0);

  return (
    <div
      className={cn(
        'p-5 sm:p-6 rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-5',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-[var(--fg)]">
          <Sparkles className="size-4 text-[var(--primary)]" />
          <span>{t('qualificationTitle')}</span>
        </h2>
      </div>

      <div className="space-y-4">
        {/* Has Content */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <SaveIndicator
              state={contentAutosave.saveState}
              onRetry={contentAutosave.retry}
              className="ms-auto"
            />
          </div>
          <TriStateToggle
            mode="boolean"
            label={t('hasContent')}
            value={contentAutosave.value}
            onChange={(val) => {
              contentAutosave.setValue(val);
              contentAutosave.flush();
            }}
          />
        </div>

        {/* Appears in Content */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <SaveIndicator
              state={appearsAutosave.saveState}
              onRetry={appearsAutosave.retry}
              className="ms-auto"
            />
          </div>
          <TriStateToggle
            mode="boolean"
            label={t('appearsInContent')}
            value={appearsAutosave.value}
            onChange={(val) => {
              appearsAutosave.setValue(val);
              appearsAutosave.flush();
            }}
          />
        </div>

        {/* Has Videographer */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <SaveIndicator
              state={videographerAutosave.saveState}
              onRetry={videographerAutosave.retry}
              className="ms-auto"
            />
          </div>
          <TriStateToggle
            mode="tristate"
            label={t('hasVideographer')}
            value={videographerAutosave.value}
            onChange={(val) => {
              videographerAutosave.setValue(val);
              videographerAutosave.flush();
            }}
          />
        </div>

        {/* Problems & Challenges Textarea */}
        <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <Label htmlFor="lead-problems" className="text-xs font-semibold">
              {t('problems')}
            </Label>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-[11px] font-mono',
                  remainingChars < 20
                    ? 'text-[var(--danger)] font-bold'
                    : 'text-[var(--fg-muted)]'
                )}
              >
                {t('charsRemaining', { count: remainingChars })}
              </span>
              <SaveIndicator
                state={problemsAutosave.saveState}
                onRetry={problemsAutosave.retry}
              />
            </div>
          </div>
          <Textarea
            id="lead-problems"
            maxLength={280}
            rows={3}
            value={problemsAutosave.value || ''}
            onChange={(e) => problemsAutosave.setValue(e.target.value || null)}
            onBlur={problemsAutosave.flush}
            placeholder={t('problemsPlaceholder')}
            className="text-sm resize-none"
          />
        </div>
      </div>
    </div>
  );
}
