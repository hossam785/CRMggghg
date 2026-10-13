'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Moon } from 'lucide-react';
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

export interface SnoozeMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadPipelineFields;
}

function SnoozeForm({
  lead,
  onOpenChange,
}: {
  lead: LeadPipelineFields;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const leadAction = useLeadAction();

  const [customDays, setCustomDays] = React.useState<number | ''>('');
  const [showCustomInput, setShowCustomInput] = React.useState(false);

  const handleSnooze = (days: number) => {
    if (days < 1 || days > 90) return;

    leadAction.mutate(
      {
        lead,
        action: 'snooze',
        payload: { days },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <div className="space-y-2 py-3">
      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={leadAction.isPending}
          onClick={() => handleSnooze(1)}
          className="h-11 flex-col py-1 text-xs"
        >
          <span className="font-semibold text-sm">+1</span>
          <span>{t('dialogs.snooze.plus1Day')}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={leadAction.isPending}
          onClick={() => handleSnooze(3)}
          className="h-11 flex-col py-1 text-xs"
        >
          <span className="font-semibold text-sm">+3</span>
          <span>{t('dialogs.snooze.plus3Days')}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={leadAction.isPending}
          onClick={() => handleSnooze(7)}
          className="h-11 flex-col py-1 text-xs"
        >
          <span className="font-semibold text-sm">+7</span>
          <span>{t('dialogs.snooze.plus7Days')}</span>
        </Button>
      </div>

      {!showCustomInput ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowCustomInput(true)}
          className="w-full text-xs text-muted-foreground hover:text-foreground mt-2"
        >
          {t('dialogs.snooze.custom')}
        </Button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (typeof customDays === 'number') {
              handleSnooze(customDays);
            }
          }}
          className="flex items-end gap-2 pt-2"
        >
          <div className="flex-1 space-y-1">
            <Label htmlFor="custom-snooze-days" className="text-xs">
              {t('dialogs.snooze.daysCount')} (1-90)
            </Label>
            <Input
              id="custom-snooze-days"
              type="number"
              min={1}
              max={90}
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value ? Number(e.target.value) : '')}
              autoFocus
              required
              className="w-full"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            loading={leadAction.isPending}
            disabled={!customDays || customDays < 1 || customDays > 90}
          >
            {t('dialogs.snooze.submit')}
          </Button>
        </form>
      )}
    </div>
  );
}

export function SnoozeMenu({ open, onOpenChange, lead }: SnoozeMenuProps) {
  const t = useTranslations();

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Moon className="size-5" />
            </div>
            <div>
              <ResponsiveDialogTitle>{t('dialogs.snooze.title')}</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                {t('dialogs.snooze.description')}
              </ResponsiveDialogDescription>
            </div>
          </div>
        </ResponsiveDialogHeader>

        {open && <SnoozeForm lead={lead} onOpenChange={onOpenChange} />}

        <ResponsiveDialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
