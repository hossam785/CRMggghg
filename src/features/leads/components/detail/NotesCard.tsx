'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SaveIndicator } from '@/components/ui/save-indicator';
import { useAutosaveField } from '../../use-autosave-field';
import { cn } from '@/lib/utils';
import type { Lead } from '../../schema';

export interface NotesCardProps {
  lead: Lead;
  className?: string;
}

export function NotesCard({ lead, className }: NotesCardProps) {
  const t = useTranslations('leads');

  const notesAutosave = useAutosaveField({
    leadId: lead.id,
    field: 'notes',
    initialValue: lead.notes,
    currentLead: lead,
    debounceMs: 600,
  });

  return (
    <div
      className={cn(
        'p-5 sm:p-6 rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-[var(--fg)]">
          <FileText className="size-4 text-[var(--primary)]" />
          <span>{t('notesTitle')}</span>
        </h2>
        <SaveIndicator
          state={notesAutosave.saveState}
          onRetry={notesAutosave.retry}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lead-notes" className="sr-only">
          {t('notesTitle')}
        </Label>
        <Textarea
          id="lead-notes"
          rows={5}
          value={notesAutosave.value || ''}
          onChange={(e) => notesAutosave.setValue(e.target.value || null)}
          onBlur={notesAutosave.flush}
          placeholder={t('notesPlaceholder')}
          className="text-sm whitespace-pre-wrap leading-relaxed"
        />
      </div>
    </div>
  );
}
