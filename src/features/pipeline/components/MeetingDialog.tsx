'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Calendar } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { useLeadAction } from '../use-lead-action';
import { type LeadPipelineFields } from '../optimistic';

export interface MeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadPipelineFields;
}

function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const dd = String(tomorrow.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function MeetingForm({
  lead,
  onOpenChange,
}: {
  lead: LeadPipelineFields;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const leadAction = useLeadAction();

  const [date, setDate] = React.useState(getTomorrowDate);
  const [time, setTime] = React.useState('10:00');

  const handleSubmit = (withDate: boolean) => {
    let meetingAt: string | undefined;

    if (withDate && date) {
      try {
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time ? time.split(':').map(Number) : [10, 0];
        const d = new Date(year ?? 2026, (month ?? 1) - 1, day ?? 1, hours ?? 10, minutes ?? 0);
        meetingAt = d.toISOString();
      } catch {
        meetingAt = undefined;
      }
    }

    leadAction.mutate(
      {
        lead,
        action: 'book_meeting',
        payload: meetingAt ? { meeting_at: meetingAt } : {},
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(Boolean(date));
      }}
      className="space-y-4 py-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="meeting-date">{t('dialogs.meeting.meetingDate')}</Label>
          <Input
            id="meeting-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            autoFocus
            className="w-full"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="meeting-time">{t('dialogs.meeting.meetingTime')}</Label>
          <Input
            id="meeting-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <ResponsiveDialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={leadAction.isPending}
          onClick={() => handleSubmit(false)}
        >
          {t('dialogs.meeting.skip')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={leadAction.isPending}
          disabled={!date}
        >
          {t('dialogs.meeting.submit')}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  );
}

export function MeetingDialog({ open, onOpenChange, lead }: MeetingDialogProps) {
  const t = useTranslations();

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Calendar className="size-5" />
            </div>
            <div>
              <ResponsiveDialogTitle>{t('dialogs.meeting.title')}</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                {t('dialogs.meeting.description')}
              </ResponsiveDialogDescription>
            </div>
          </div>
        </ResponsiveDialogHeader>

        {open && <MeetingForm lead={lead} onOpenChange={onOpenChange} />}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
