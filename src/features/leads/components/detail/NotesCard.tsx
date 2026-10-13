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
        'p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-2xs space-y-4',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border pb-3.5">
        <h2 className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-foreground">
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <FileText className="size-4" />
          </div>
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
          className="text-sm whitespace-pre-wrap leading-relaxed rounded-xl border-border bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary/40"
        />
      </div>
    </div>
  );
}
