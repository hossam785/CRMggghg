'use client';

import * as React from 'react';
import { PrimaryActionButton } from './PrimaryActionButton';
import { SecondaryActions } from './SecondaryActions';
import { MeetingDialog } from './MeetingDialog';
import { LostReasonDialog } from './LostReasonDialog';
import { ReminderDialog } from './ReminderDialog';
import { SnoozeMenu } from './SnoozeMenu';
import { StageOverrideMenu } from './StageOverrideMenu';
import {
  ACTIONS,
  primaryActionFor,
  isActionAllowed,
  type LeadAction,
} from '../stages';
import { useLeadAction } from '../use-lead-action';
import { type LeadPipelineFields } from '../optimistic';

export interface ActionBarProps {
  lead: LeadPipelineFields;
  className?: string;
}

export function ActionBar({ lead, className }: ActionBarProps) {
  const leadAction = useLeadAction();

  // Dialog open states
  const [meetingOpen, setMeetingOpen] = React.useState(false);
  const [lostOpen, setLostOpen] = React.useState(false);
  const [reminderOpen, setReminderOpen] = React.useState(false);
  const [snoozeOpen, setSnoozeOpen] = React.useState(false);
  const [stageOverrideOpen, setStageOverrideOpen] = React.useState(false);

  const anyDialogOpen =
    meetingOpen || lostOpen || reminderOpen || snoozeOpen || stageOverrideOpen;

  const handleAction = React.useCallback(
    (action: LeadAction) => {
      const meta = ACTIONS[action];
      if (!meta) return;

      switch (meta.dialogType) {
        case 'meeting':
          setMeetingOpen(true);
          break;
        case 'lost_reason':
          setLostOpen(true);
          break;
        case 'reminder':
          setReminderOpen(true);
          break;
        case 'snooze':
          setSnoozeOpen(true);
          break;
        case 'stage_override':
          setStageOverrideOpen(true);
          break;
        case 'none':
        default:
          leadAction.mutate({ lead, action });
          break;
      }
    },
    [lead, leadAction]
  );

  // Keyboard shortcuts listener for detail page (E = Primary, R = Reply, L = Lost)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (anyDialogOpen || leadAction.isPending) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'e') {
        const prim = primaryActionFor(lead.stage);
        if (prim) {
          e.preventDefault();
          handleAction(prim);
        }
      } else if (key === 'r') {
        if (isActionAllowed('reply_received', lead)) {
          e.preventDefault();
          handleAction('reply_received');
        }
      } else if (key === 'l') {
        if (isActionAllowed('mark_lost', lead)) {
          e.preventDefault();
          handleAction('mark_lost');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lead, anyDialogOpen, leadAction.isPending, handleAction]);

  return (
    <>
      {/* Action Bar Container */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-border bg-card/95 p-3.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg backdrop-blur-md md:static md:z-auto md:border md:rounded-2xl md:p-4 md:shadow-2xs md:backdrop-blur-none ${
          className || ''
        }`}
      >
        <div className="flex flex-1 items-center gap-2">
          <PrimaryActionButton
            lead={lead}
            onActionTrigger={handleAction}
            size="lg"
            showShortcut
            className="flex-1 sm:flex-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <SecondaryActions lead={lead} onActionTrigger={handleAction} maxVisible={2} />
        </div>
      </div>

      {/* Action Dialogs */}
      <MeetingDialog
        open={meetingOpen}
        onOpenChange={setMeetingOpen}
        lead={lead}
      />
      <LostReasonDialog
        open={lostOpen}
        onOpenChange={setLostOpen}
        lead={lead}
      />
      <ReminderDialog
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        lead={lead}
      />
      <SnoozeMenu
        open={snoozeOpen}
        onOpenChange={setSnoozeOpen}
        lead={lead}
      />
      <StageOverrideMenu
        open={stageOverrideOpen}
        onOpenChange={setStageOverrideOpen}
        lead={lead}
      />
    </>
  );
}
