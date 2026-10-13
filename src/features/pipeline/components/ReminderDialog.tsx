'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Bell } from 'lucide-react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLeadAction } from '../use-lead-action';
import { type LeadPipelineFields } from '../optimistic';

export interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadPipelineFields;
}

function formatDateISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getPresets(locale: string) {
  const today = new Date();

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const in3Days = new Date(today);
  in3Days.setDate(in3Days.getDate() + 3);

  const nextWeek = new Date(today);
  const dayOfWeek = today.getDay();
  const targetDay = locale === 'ar' ? 0 : 1;
  let daysUntilTarget = (targetDay - dayOfWeek + 7) % 7;
  if (daysUntilTarget === 0) daysUntilTarget = 7;
  nextWeek.setDate(nextWeek.getDate() + daysUntilTarget);

  return {
    tomorrow: formatDateISO(tomorrow),
    in3Days: formatDateISO(in3Days),
    nextWeek: formatDateISO(nextWeek),
  };
}

function ReminderForm({
  lead,
  onOpenChange,
}: {
  lead: LeadPipelineFields;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const leadAction = useLeadAction();

  const presets = React.useMemo(() => getPresets(locale), [locale]);

  const [date, setDate] = React.useState(() => presets.tomorrow);
  const [note, setNote] = React.useState(() => lead.reminder_note || '');
  const [activePreset, setActivePreset] = React.useState<'tomorrow' | 'in3Days' | 'nextWeek' | 'custom'>('tomorrow');

  const handleSelectPreset = (preset: 'tomorrow' | 'in3Days' | 'nextWeek') => {
    setActivePreset(preset);
    setDate(presets[preset]);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!date) return;

    leadAction.mutate(
      {
        lead,
        action: 'set_reminder',
        payload: {
          reminder_on: date,
          note: note.trim() ? note.trim().slice(0, 140) : undefined,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  const charsLeft = 140 - note.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      {/* Preset Buttons */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          {t('dialogs.reminder.presets.custom')}
        </Label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleSelectPreset('tomorrow')}
            className={`py-2 px-2.5 text-xs font-medium rounded-xl border text-center transition-all ${
              activePreset === 'tomorrow'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-foreground hover:bg-muted/40'
            }`}
          >
            {t('dialogs.reminder.presets.tomorrow')}
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('in3Days')}
            className={`py-2 px-2.5 text-xs font-medium rounded-xl border text-center transition-all ${
              activePreset === 'in3Days'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-foreground hover:bg-muted/40'
            }`}
          >
            {t('dialogs.reminder.presets.in3Days')}
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('nextWeek')}
            className={`py-2 px-2.5 text-xs font-medium rounded-xl border text-center transition-all ${
              activePreset === 'nextWeek'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-foreground hover:bg-muted/40'
            }`}
          >
            {t('dialogs.reminder.presets.nextWeek')}
          </button>
        </div>
      </div>

      {/* Date Picker */}
      <div className="space-y-1.5">
        <Label htmlFor="reminder-date">{t('dialogs.reminder.date')}</Label>
        <Input
          id="reminder-date"
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setActivePreset('custom');
          }}
          required
          className="w-full"
        />
      </div>

      {/* Note Input */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="reminder-note">{t('dialogs.reminder.note')}</Label>
          <span
            className={`text-[11px] ${
              charsLeft < 10 ? 'text-destructive font-bold' : 'text-muted-foreground'
            }`}
          >
            {t('dialogs.reminder.charsLeft', { count: charsLeft })}
          </span>
        </div>
        <Textarea
          id="reminder-note"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 140))}
          placeholder={t('dialogs.reminder.notePlaceholder')}
          rows={2}
          maxLength={140}
          className="resize-none"
        />
      </div>

      <ResponsiveDialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={leadAction.isPending}
          onClick={() => onOpenChange(false)}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={leadAction.isPending}
          disabled={!date}
        >
          {t('dialogs.reminder.submit')}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  );
}

export function ReminderDialog({ open, onOpenChange, lead }: ReminderDialogProps) {
  const t = useTranslations();

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bell className="size-5" />
            </div>
            <div>
              <ResponsiveDialogTitle>{t('dialogs.reminder.title')}</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                {t('dialogs.reminder.description')}
              </ResponsiveDialogDescription>
            </div>
          </div>
        </ResponsiveDialogHeader>

        {open && <ReminderForm lead={lead} onOpenChange={onOpenChange} />}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
