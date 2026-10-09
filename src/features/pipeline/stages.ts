/**
 * Pipeline stages, actions, transitions, and UX action bindings.
 * Single source of truth for pipeline logic across the application.
 *
 * NOTE: The transition rules and stage permissions defined here MUST mirror
 * the SQL constraints and functions defined in:
 * `supabase/migrations/0005_pipeline.sql` (§4.1, §4.2, §4.6).
 */

import type { ComponentType } from 'react';
import {
  Inbox,
  Send,
  Clock,
  Clock3,
  Clock4,
  MessageCircle,
  Calendar,
  FileText,
  Trophy,
  XCircle,
  RotateCcw,
  Bell,
  BellOff,
  Moon,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import type { LeadStage, LostReason } from '@/types/database';

export type StageGroup = 'inbox' | 'waiting' | 'active' | 'closed';

export interface StageMeta {
  key: LeadStage;
  order: number;
  group: StageGroup;
  colorToken: string;
  icon: ComponentType<{ className?: string }>;
}

export const STAGES: Record<LeadStage, StageMeta> = {
  new: {
    key: 'new',
    order: 1,
    group: 'inbox',
    colorToken: 'stage-new',
    icon: Inbox,
  },
  message_sent: {
    key: 'message_sent',
    order: 2,
    group: 'waiting',
    colorToken: 'stage-message_sent',
    icon: Send,
  },
  follow_up_1: {
    key: 'follow_up_1',
    order: 3,
    group: 'waiting',
    colorToken: 'stage-follow_up_1',
    icon: Clock,
  },
  follow_up_2: {
    key: 'follow_up_2',
    order: 4,
    group: 'waiting',
    colorToken: 'stage-follow_up_2',
    icon: Clock3,
  },
  follow_up_3: {
    key: 'follow_up_3',
    order: 5,
    group: 'waiting',
    colorToken: 'stage-follow_up_3',
    icon: Clock4,
  },
  replied: {
    key: 'replied',
    order: 6,
    group: 'active',
    colorToken: 'stage-replied',
    icon: MessageCircle,
  },
  meeting_booked: {
    key: 'meeting_booked',
    order: 7,
    group: 'active',
    colorToken: 'stage-meeting_booked',
    icon: Calendar,
  },
  proposal_sent: {
    key: 'proposal_sent',
    order: 8,
    group: 'active',
    colorToken: 'stage-proposal_sent',
    icon: FileText,
  },
  won: {
    key: 'won',
    order: 9,
    group: 'closed',
    colorToken: 'stage-won',
    icon: Trophy,
  },
  lost: {
    key: 'lost',
    order: 10,
    group: 'closed',
    colorToken: 'stage-lost',
    icon: XCircle,
  },
};

export const STAGE_LIST = Object.values(STAGES).sort((a, b) => a.order - b.order);

export type LeadAction =
  | 'send_message'
  | 'send_follow_up'
  | 'reply_received'
  | 'book_meeting'
  | 'send_proposal'
  | 'mark_won'
  | 'mark_lost'
  | 'reopen'
  | 'set_reminder'
  | 'clear_reminder'
  | 'snooze'
  | 'restart'
  | 'set_stage';

export interface ActionMeta {
  key: LeadAction;
  icon: ComponentType<{ className?: string }>;
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  dialogType: 'none' | 'meeting' | 'lost_reason' | 'reminder' | 'snooze' | 'stage_override';
}

export const ACTIONS: Record<LeadAction, ActionMeta> = {
  send_message: {
    key: 'send_message',
    icon: Send,
    variant: 'primary',
    dialogType: 'none',
  },
  send_follow_up: {
    key: 'send_follow_up',
    icon: Clock,
    variant: 'primary',
    dialogType: 'none',
  },
  reply_received: {
    key: 'reply_received',
    icon: MessageCircle,
    variant: 'secondary',
    dialogType: 'none',
  },
  book_meeting: {
    key: 'book_meeting',
    icon: Calendar,
    variant: 'primary',
    dialogType: 'meeting',
  },
  send_proposal: {
    key: 'send_proposal',
    icon: FileText,
    variant: 'primary',
    dialogType: 'none',
  },
  mark_won: {
    key: 'mark_won',
    icon: Trophy,
    variant: 'primary',
    dialogType: 'none',
  },
  mark_lost: {
    key: 'mark_lost',
    icon: XCircle,
    variant: 'danger',
    dialogType: 'lost_reason',
  },
  reopen: {
    key: 'reopen',
    icon: RotateCcw,
    variant: 'secondary',
    dialogType: 'none',
  },
  set_reminder: {
    key: 'set_reminder',
    icon: Bell,
    variant: 'outline',
    dialogType: 'reminder',
  },
  clear_reminder: {
    key: 'clear_reminder',
    icon: BellOff,
    variant: 'ghost',
    dialogType: 'none',
  },
  snooze: {
    key: 'snooze',
    icon: Moon,
    variant: 'outline',
    dialogType: 'snooze',
  },
  restart: {
    key: 'restart',
    icon: RefreshCw,
    variant: 'outline',
    dialogType: 'none',
  },
  set_stage: {
    key: 'set_stage',
    icon: SlidersHorizontal,
    variant: 'ghost',
    dialogType: 'stage_override',
  },
};

export const ACTION_I18N_KEYS: Record<LeadAction, string> = {
  send_message: 'actions.sendMessage',
  send_follow_up: 'actions.sendFollowUp',
  reply_received: 'actions.replyReceived',
  book_meeting: 'actions.bookMeeting',
  send_proposal: 'actions.sendProposal',
  mark_won: 'actions.markWon',
  mark_lost: 'actions.markLost',
  reopen: 'actions.reopen',
  set_reminder: 'actions.setReminder',
  clear_reminder: 'actions.clearReminder',
  snooze: 'actions.snooze',
  restart: 'actions.restart',
  set_stage: 'actions.setStage',
};

/**
 * Transition allowances mirrored from `supabase/migrations/0005_pipeline.sql`.
 */
const WAITING_STAGES: LeadStage[] = ['message_sent', 'follow_up_1', 'follow_up_2', 'follow_up_3'];
const OPEN_STAGES: LeadStage[] = [
  'new',
  'message_sent',
  'follow_up_1',
  'follow_up_2',
  'follow_up_3',
  'replied',
  'meeting_booked',
  'proposal_sent',
];

export const TRANSITIONS: Record<LeadAction, readonly LeadStage[] | 'all' | 'open' | 'non_waiting'> = {
  send_message: ['new'],
  send_follow_up: ['message_sent', 'follow_up_1', 'follow_up_2'],
  reply_received: ['new', 'message_sent', 'follow_up_1', 'follow_up_2', 'follow_up_3'],
  book_meeting: ['new', 'message_sent', 'follow_up_1', 'follow_up_2', 'follow_up_3', 'replied'],
  send_proposal: ['replied', 'meeting_booked'],
  mark_won: 'open',
  mark_lost: 'open',
  reopen: ['won', 'lost'],
  set_reminder: 'all',
  clear_reminder: 'non_waiting',
  snooze: 'all',
  restart: ['follow_up_3', 'lost'],
  set_stage: 'all',
};

/**
 * Returns the smart primary action for the given stage per §4.6.
 */
export function primaryActionFor(stage: LeadStage): LeadAction | null {
  switch (stage) {
    case 'new':
      return 'send_message';
    case 'message_sent':
    case 'follow_up_1':
    case 'follow_up_2':
      return 'send_follow_up';
    case 'follow_up_3':
      return 'reply_received';
    case 'replied':
      return 'book_meeting';
    case 'meeting_booked':
      return 'send_proposal';
    case 'proposal_sent':
      return 'mark_won';
    case 'won':
    case 'lost':
      return 'reopen';
    default:
      return null;
  }
}

/**
 * Returns secondary actions for the given stage per §4.6.
 */
export function secondaryActionsFor(stage: LeadStage): LeadAction[] {
  switch (stage) {
    case 'new':
      return ['reply_received', 'mark_lost', 'set_reminder'];
    case 'message_sent':
    case 'follow_up_1':
    case 'follow_up_2':
      return ['reply_received', 'mark_lost', 'set_reminder', 'snooze'];
    case 'follow_up_3':
      return ['mark_lost', 'restart', 'set_reminder', 'snooze'];
    case 'replied':
      return ['send_proposal', 'mark_won', 'mark_lost', 'set_reminder'];
    case 'meeting_booked':
      return ['mark_won', 'mark_lost', 'set_reminder'];
    case 'proposal_sent':
      return ['mark_lost', 'set_reminder'];
    case 'won':
      return ['set_reminder'];
    case 'lost':
      return ['restart', 'set_reminder'];
    default:
      return [];
  }
}

/**
 * Verifies if an action is currently allowed for a lead per SQL rules.
 */
export function isActionAllowed(
  action: LeadAction,
  lead: { stage: LeadStage; next_follow_up_on?: string | null }
): boolean {
  if (action === 'clear_reminder') {
    return !WAITING_STAGES.includes(lead.stage) && Boolean(lead.next_follow_up_on);
  }

  if (action === 'snooze') {
    return Boolean(lead.next_follow_up_on);
  }

  const allowed = TRANSITIONS[action];
  if (allowed === 'all') return true;
  if (allowed === 'open') return OPEN_STAGES.includes(lead.stage);
  if (allowed === 'non_waiting') return !WAITING_STAGES.includes(lead.stage);
  return allowed.includes(lead.stage);
}

// Action Payloads
export interface MeetingPayload {
  meeting_at?: string | null;
}

export interface LostPayload {
  reason: LostReason;
}

export interface ReminderPayload {
  date: string;
  note?: string | null;
}

export interface SnoozePayload {
  days: number;
}

export interface RestartPayload {
  after_days?: number | null;
}

export interface SetStagePayload {
  to_stage: LeadStage;
  reason?: LostReason | null;
}

export interface ReopenPayload {
  to_stage?: LeadStage | null;
}

export type ActionPayloadMap = {
  send_message: Record<string, never>;
  send_follow_up: Record<string, never>;
  reply_received: Record<string, never>;
  book_meeting: MeetingPayload;
  send_proposal: Record<string, never>;
  mark_won: Record<string, never>;
  mark_lost: LostPayload;
  reopen: ReopenPayload;
  set_reminder: ReminderPayload;
  clear_reminder: Record<string, never>;
  snooze: SnoozePayload;
  restart: RestartPayload;
  set_stage: SetStagePayload;
};
