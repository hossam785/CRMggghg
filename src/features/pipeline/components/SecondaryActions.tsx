'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';
import {
  secondaryActionsFor,
  ACTIONS,
  ACTION_I18N_KEYS,
  type LeadAction,
} from '../stages';
import { useLeadAction } from '../use-lead-action';
import { type LeadPipelineFields } from '../optimistic';

export interface SecondaryActionsProps {
  lead: LeadPipelineFields;
  onActionTrigger: (action: LeadAction) => void;
  maxVisible?: number;
}

export function SecondaryActions({
  lead,
  onActionTrigger,
  maxVisible = 2,
}: SecondaryActionsProps) {
  const t = useTranslations();
  const leadAction = useLeadAction();

  const allSecondary = secondaryActionsFor(lead.stage);

  // Split into visible buttons and overflow
  const visibleActions = allSecondary.slice(0, maxVisible);
  const overflowActions = allSecondary.slice(maxVisible);

  const renderActionButton = (actionKey: LeadAction) => {
    const meta = ACTIONS[actionKey];
    const Icon = meta.icon;
    const label = t(ACTION_I18N_KEYS[actionKey] as Parameters<typeof t>[0]);

    const shortcutKey =
      actionKey === 'reply_received' ? 'R' : actionKey === 'mark_lost' ? 'L' : null;

    const btn = (
      <Button
        key={actionKey}
        type="button"
        variant={meta.variant === 'danger' ? 'danger' : 'outline'}
        size="md"
        disabled={leadAction.isPending}
        onClick={() => onActionTrigger(actionKey)}
        className={cn(
          'rounded-full gap-1.5 h-9 font-medium shadow-2xs transition-all',
          meta.variant === 'danger'
            ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            : 'border-border bg-card hover:bg-muted/40 text-foreground'
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span className="hidden sm:inline">{label}</span>
      </Button>
    );

    if (!shortcutKey) return btn;

    return (
      <Tooltip key={actionKey}>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="top" className="flex items-center gap-1.5">
          <span>{label}</span>
          <Kbd>{shortcutKey}</Kbd>
        </TooltipContent>
      </Tooltip>
    );
  };

  const hasOverflow = overflowActions.length > 0;

  return (
    <div className="flex items-center gap-2">
      {visibleActions.map((action) => renderActionButton(action))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={leadAction.isPending}
            className="rounded-full size-9 p-0 border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground shadow-2xs"
            aria-label={t('a11y.openMenu')}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl border-border bg-card p-1.5 shadow-lg">
          {hasOverflow && (
            <>
              {overflowActions.map((actionKey) => {
                const meta = ACTIONS[actionKey];
                const Icon = meta.icon;
                const label = t(ACTION_I18N_KEYS[actionKey] as Parameters<typeof t>[0]);
                const isDanger = meta.variant === 'danger';

                return (
                  <DropdownMenuItem
                    key={actionKey}
                    onClick={() => onActionTrigger(actionKey)}
                    className={`gap-2 cursor-pointer ${
                      isDanger ? 'text-destructive focus:text-destructive focus:bg-destructive/10' : ''
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{label}</span>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Clear reminder if set */}
          {Boolean(lead.reminder_note) && (
            <DropdownMenuItem
              onClick={() => onActionTrigger('clear_reminder')}
              className="gap-2 cursor-pointer text-muted-foreground"
            >
              {React.createElement(ACTIONS.clear_reminder.icon, {
                className: 'size-4 shrink-0',
              })}
              <span>{t(ACTION_I18N_KEYS.clear_reminder as Parameters<typeof t>[0])}</span>
            </DropdownMenuItem>
          )}

          {/* Stage override */}
          <DropdownMenuItem
            onClick={() => onActionTrigger('set_stage')}
            className="gap-2 cursor-pointer"
          >
            {React.createElement(ACTIONS.set_stage.icon, {
              className: 'size-4 shrink-0',
            })}
            <span>{t(ACTION_I18N_KEYS.set_stage as Parameters<typeof t>[0])}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
