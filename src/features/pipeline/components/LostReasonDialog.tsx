'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { XCircle, Ban, PhoneOff, DollarSign, Clock, HelpCircle } from 'lucide-react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { useLeadAction } from '../use-lead-action';
import { type LeadPipelineFields } from '../optimistic';
import { type LostReason } from '@/types/database';

export interface LostReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadPipelineFields;
}

const REASONS: { key: LostReason; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'not_interested', icon: Ban },
  { key: 'no_reply', icon: PhoneOff },
  { key: 'budget', icon: DollarSign },
  { key: 'timing', icon: Clock },
  { key: 'other', icon: HelpCircle },
];

export function LostReasonDialog({ open, onOpenChange, lead }: LostReasonDialogProps) {
  const t = useTranslations();
  const leadAction = useLeadAction();

  const handleSelectReason = (reason?: LostReason) => {
    leadAction.mutate(
      {
        lead,
        action: 'mark_lost',
        payload: reason ? { reason } : {},
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="size-5" />
            </div>
            <div>
              <ResponsiveDialogTitle>{t('dialogs.lostReason.title')}</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                {t('dialogs.lostReason.description')}
              </ResponsiveDialogDescription>
            </div>
          </div>
        </ResponsiveDialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-3">
          {REASONS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              disabled={leadAction.isPending}
              onClick={() => handleSelectReason(key)}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-destructive/40 text-start text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 active:scale-[0.98]"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
                <Icon className="size-4" />
              </span>
              <span className="flex-1 truncate">{t(`dialogs.lostReason.reasons.${key}`)}</span>
            </button>
          ))}
        </div>

        <ResponsiveDialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            disabled={leadAction.isPending}
            onClick={() => handleSelectReason(undefined)}
            className="w-full sm:w-auto"
          >
            {t('dialogs.lostReason.skip')}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
