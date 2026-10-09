/**
 * Optimistic update logic for pipeline actions (§4.5, §18.5.2).
 * Mirrors the exact column transformations of `lead_action` in `0005_pipeline.sql`.
 */

import type { LeadStage, LostReason } from '@/types/database';
import type { LeadAction } from './stages';

export interface PipelineSettingsLike {
  fu1_after_days: number;
  fu2_after_days: number;
  fu3_after_days: number;
  give_up_after_days: number;
  timezone?: string;
}

export interface LeadPipelineFields {
  id: string;
  stage: LeadStage;
  stage_changed_at?: string;
  first_message_at?: string | null;
  last_contacted_at?: string | null;
  follow_ups_sent?: number;
  next_follow_up_on?: string | null;
  reminder_note?: string | null;
  replied_at?: string | null;
  meeting_booked_at?: string | null;
  meeting_at?: string | null;
  proposal_sent_at?: string | null;
  won_at?: string | null;
  lost_at?: string | null;
  lost_reason?: LostReason | null;
}

/**
 * Adds N days to a YYYY-MM-DD date using UTC arithmetic to avoid DST or timezone drift.
 */
export function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split('-');
  const y = Number(parts[0]) || 2026;
  const m = Number(parts[1]) || 1;
  const d = Number(parts[2]) || 1;
  const date = new Date(Date.UTC(y, m - 1, d + days));
  const iso = date.toISOString();
  const datePart = iso.split('T')[0];
  return datePart || dateStr;
}

/**
 * Applies a pipeline action optimistically to a lead, producing an updated lead object
 * with exact column values identical to those produced by PostgreSQL's `lead_action`.
 */
export function applyActionOptimistic<T extends LeadPipelineFields>(
  lead: T,
  action: LeadAction,
  payload: Record<string, unknown> | undefined,
  settings: PipelineSettingsLike,
  today: string
): T {
  const now = new Date().toISOString();

  switch (action) {
    case 'send_message':
      return {
        ...lead,
        stage: 'message_sent',
        stage_changed_at: now,
        first_message_at: lead.first_message_at || now,
        last_contacted_at: now,
        follow_ups_sent: 0,
        next_follow_up_on: addDays(today, settings.fu1_after_days),
      };

    case 'send_follow_up': {
      const nextStage: LeadStage =
        lead.stage === 'message_sent'
          ? 'follow_up_1'
          : lead.stage === 'follow_up_1'
          ? 'follow_up_2'
          : 'follow_up_3';
      const days =
        lead.stage === 'message_sent'
          ? settings.fu2_after_days
          : lead.stage === 'follow_up_1'
          ? settings.fu3_after_days
          : settings.give_up_after_days;

      return {
        ...lead,
        stage: nextStage,
        stage_changed_at: now,
        last_contacted_at: now,
        follow_ups_sent: (lead.follow_ups_sent ?? 0) + 1,
        next_follow_up_on: addDays(today, days),
      };
    }

    case 'reply_received':
      return {
        ...lead,
        stage: 'replied',
        stage_changed_at: now,
        replied_at: lead.replied_at || now,
        next_follow_up_on: null,
        reminder_note: null,
      };

    case 'book_meeting':
      return {
        ...lead,
        stage: 'meeting_booked',
        stage_changed_at: now,
        meeting_booked_at: now,
        replied_at: lead.replied_at || now,
        meeting_at: (payload?.meeting_at as string) || null,
        next_follow_up_on: null,
        reminder_note: null,
      };

    case 'send_proposal':
      return {
        ...lead,
        stage: 'proposal_sent',
        stage_changed_at: now,
        proposal_sent_at: now,
      };

    case 'mark_won':
      return {
        ...lead,
        stage: 'won',
        stage_changed_at: now,
        won_at: now,
        next_follow_up_on: null,
        reminder_note: null,
      };

    case 'mark_lost':
      return {
        ...lead,
        stage: 'lost',
        stage_changed_at: now,
        lost_at: now,
        lost_reason: (payload?.reason as LostReason) || null,
        next_follow_up_on: null,
        reminder_note: null,
      };

    case 'reopen':
      return {
        ...lead,
        stage: (payload?.to_stage as LeadStage) || 'replied',
        stage_changed_at: now,
        won_at: null,
        lost_at: null,
        lost_reason: null,
      };

    case 'set_reminder':
      return {
        ...lead,
        next_follow_up_on: (payload?.date as string) || null,
        reminder_note: payload?.note
          ? String(payload.note).trim().slice(0, 140)
          : null,
      };

    case 'clear_reminder':
      return {
        ...lead,
        next_follow_up_on: null,
        reminder_note: null,
      };

    case 'snooze': {
      const base =
        lead.next_follow_up_on && lead.next_follow_up_on > today
          ? lead.next_follow_up_on
          : today;
      const snoozeDays = Math.min(Math.max(Number(payload?.days) || 1, 1), 90);
      return {
        ...lead,
        next_follow_up_on: addDays(base, snoozeDays),
      };
    }

    case 'restart':
      return {
        ...lead,
        stage: 'new',
        stage_changed_at: now,
        follow_ups_sent: 0,
        lost_at: null,
        lost_reason: null,
        next_follow_up_on: payload?.after_days
          ? addDays(today, Number(payload.after_days))
          : null,
        reminder_note: null,
      };

    case 'set_stage': {
      const toStage = (payload?.to_stage as LeadStage) || lead.stage;
      const isWaiting = ['message_sent', 'follow_up_1', 'follow_up_2', 'follow_up_3'].includes(toStage);
      const isClosedOrActive = ['won', 'lost', 'replied', 'meeting_booked'].includes(toStage);

      return {
        ...lead,
        stage: toStage,
        stage_changed_at: now,
        next_follow_up_on: isWaiting
          ? lead.next_follow_up_on || addDays(today, settings.fu1_after_days)
          : isClosedOrActive
          ? null
          : lead.next_follow_up_on,
        won_at: toStage === 'won' ? lead.won_at || now : null,
        lost_at: toStage === 'lost' ? lead.lost_at || now : null,
        lost_reason: toStage === 'lost' ? (payload?.reason as LostReason) || lead.lost_reason || 'other' : null,
      };
    }

    default:
      return lead;
  }
}
