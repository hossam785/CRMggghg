'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, Check } from 'lucide-react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { StageBadge } from '@/components/ui/stage-badge';
import { STAGE_LIST } from '../stages';
import { useLeadAction } from '../use-lead-action';
import { type LeadPipelineFields } from '../optimistic';
import { type LeadStage } from '@/types/database';

export interface StageOverrideMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadPipelineFields;
}

export function StageOverrideMenu({ open, onOpenChange, lead }: StageOverrideMenuProps) {
  const t = useTranslations();
  const leadAction = useLeadAction();

  const handleSelectStage = (stage: LeadStage) => {
    if (stage === lead.stage) {
      onOpenChange(false);
      return;
    }

    leadAction.mutate(
      {
        lead,
        action: 'set_stage',
        payload: { to_stage: stage },
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
            <div className="flex size-9 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--fg)]">
              <SlidersHorizontal className="size-5" />
            </div>
            <div>
              <ResponsiveDialogTitle>{t('dialogs.stageOverride.title')}</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                {t('dialogs.stageOverride.description')}
              </ResponsiveDialogDescription>
            </div>
          </div>
        </ResponsiveDialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-1.5 py-3 pe-1">
          {STAGE_LIST.map((stageMeta) => {
            const isCurrent = stageMeta.key === lead.stage;
            return (
              <button
                key={stageMeta.key}
                type="button"
                disabled={leadAction.isPending}
                onClick={() => handleSelectStage(stageMeta.key)}
                className={`w-full flex items-center justify-between p-2.5 rounded-[var(--radius-md)] border text-start transition-all ${
                  isCurrent
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5 font-semibold'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <StageBadge stage={stageMeta.key} size="sm" />
                </div>
                {isCurrent && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--primary)] font-medium">
                    <span>{t('dialogs.stageOverride.currentStage')}</span>
                    <Check className="size-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <ResponsiveDialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={leadAction.isPending}
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
