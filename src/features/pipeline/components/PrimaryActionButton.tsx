'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';
import {
  primaryActionFor,
  ACTIONS,
  ACTION_I18N_KEYS,
  type LeadAction,
} from '../stages';
import { useLeadAction } from '../use-lead-action';
import { type LeadPipelineFields } from '../optimistic';

export interface PrimaryActionButtonProps {
  lead: LeadPipelineFields;
  onActionTrigger?: (action: LeadAction) => void;
  size?: 'sm' | 'md' | 'lg';
  showShortcut?: boolean;
  className?: string;
}

export function PrimaryActionButton({
  lead,
  onActionTrigger,
  size = 'md',
  showShortcut = false,
  className,
}: PrimaryActionButtonProps) {
  const t = useTranslations();
  const leadAction = useLeadAction();

  const actionKey = primaryActionFor(lead.stage);
  if (!actionKey) return null;

  const actionMeta = ACTIONS[actionKey];
  const Icon = actionMeta.icon;
  const labelKey = ACTION_I18N_KEYS[actionKey];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onActionTrigger) {
      onActionTrigger(actionKey);
    } else {
      leadAction.mutate({ lead, action: actionKey });
    }
  };

  const buttonVariant: ButtonProps['variant'] =
    actionMeta.variant === 'danger' ? 'danger' : 'primary';

  const buttonElement = (
    <Button
      variant={buttonVariant}
      size={size}
      disabled={leadAction.isPending}
      loading={leadAction.isPending}
      onClick={handleClick}
      className={cn(
        'rounded-full font-bold shadow-2xs gap-2 transition-all',
        buttonVariant === 'primary' &&
          'bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs',
        className
      )}
    >
      <Icon className={size === 'lg' ? 'size-5' : 'size-4'} />
      <span>{t(labelKey as Parameters<typeof t>[0])}</span>
    </Button>
  );

  if (!showShortcut) {
    return buttonElement;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
      <TooltipContent side="top" className="flex items-center gap-1.5">
        <span>{t('shortcuts.primaryAction')}</span>
        <Kbd>E</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}
