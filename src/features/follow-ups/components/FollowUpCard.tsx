'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Check,
  MoreHorizontal,
  MessageCircle,
  XCircle,
  Moon,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StageBadge } from '@/components/ui/stage-badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { OpenDmButton } from './OpenDmButton';
import { SwipeableRow } from './SwipeableRow';
import { SnoozeMenu } from '@/features/pipeline/components/SnoozeMenu';
import { LostReasonDialog } from '@/features/pipeline/components/LostReasonDialog';
import { useLeadAction } from '@/features/pipeline/use-lead-action';
import { type FollowUpQueueRow, type FollowUpBucket } from '@/types/database';
import { type LeadPipelineFields } from '@/features/pipeline/optimistic';

export interface FollowUpCardProps {
  item: FollowUpQueueRow;
  className?: string;
}

export function FollowUpCard({ item, className }: FollowUpCardProps) {
  const t = useTranslations('followUps');
  const locale = useLocale();
  const router = useRouter();
  const leadAction = useLeadAction();

  const [highlightDone, setHighlightDone] = React.useState(false);
  const [snoozeOpen, setSnoozeOpen] = React.useState(false);
  const [lostOpen, setLostOpen] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);

  // Convert row into LeadPipelineFields for pipeline action hooks
  const leadFields = React.useMemo<LeadPipelineFields>(() => {
    return {
      id: item.id,
      stage: item.stage,
      stage_changed_at: new Date().toISOString(),
      first_message_at: null,
      last_contacted_at: item.last_contacted_at,
      follow_ups_sent: 0,
      next_follow_up_on: item.next_follow_up_on,
      reminder_note: item.reminder_note,
      replied_at: null,
      meeting_booked_at: null,
      meeting_at: item.meeting_at,
      proposal_sent_at: null,
      won_at: null,
      lost_at: null,
      lost_reason: null,
      name: item.name,
    };
  }, [item]);

  // Return-to-tab highlight listener
  const handleDmOpened = () => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setHighlightDone(true);
        setTimeout(() => setHighlightDone(false), 5000);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
  };

  // Days since last contact computation
  const [mountedTime] = React.useState(() => Date.now());
  const daysSinceContact = React.useMemo(() => {
    if (!item.last_contacted_at) return null;
    const diff = Math.floor((mountedTime - new Date(item.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [item.last_contacted_at, mountedTime]);

  // Execute primary bucket action
  const handlePrimaryDone = () => {
    setIsExiting(true);
    const bucket = item.bucket as FollowUpBucket;

    if (bucket === 'reminder') {
      leadAction.mutate({
        lead: leadFields,
        action: 'clear_reminder',
      });
    } else if (bucket === 'exhausted') {
      // Default to lost on done click, or user can click retry
      leadAction.mutate({
        lead: leadFields,
        action: 'mark_lost',
        payload: { reason: 'no_reply' },
      });
    } else {
      // due_fu1, due_fu2, due_fu3
      leadAction.mutate({
        lead: leadFields,
        action: 'send_follow_up',
      });
    }
  };

  const bucket = item.bucket as FollowUpBucket;

  return (
    <div
      className={`transition-all duration-150 ease-out ${
        isExiting ? 'opacity-0 h-0 overflow-hidden m-0 p-0' : ''
      }`}
    >
      <SwipeableRow onSwipeAction={handlePrimaryDone} disabled={bucket === 'meeting_today'}>
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-2xs hover:border-[var(--primary)]/30 transition-all ${
            className || ''
          }`}
        >
          {/* Left: Lead Identity & Badges */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => router.push(`/leads/${item.id}`)}
                className="font-bold text-sm text-[var(--fg)] hover:text-[var(--primary)] hover:underline truncate text-start"
              >
                {item.name}
              </button>

              <StageBadge stage={item.stage} size="sm" />

              {/* Overdue Badge */}
              {item.days_overdue > 0 ? (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-xs text-[10px] font-semibold bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20">
                  {t('badges.overdueDays', { count: item.days_overdue })}
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-xs text-[10px] font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
                  {t('badges.today')}
                </span>
              )}
            </div>

            {/* Note or handle and days since last contact */}
            <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)] mt-1 flex-wrap">
              {item.instagram_handle && (
                <span>@{item.instagram_handle}</span>
              )}
              {item.whatsapp_e164 && (
                <bdi className="font-mono text-[11px]">{item.whatsapp_e164}</bdi>
              )}
              {daysSinceContact !== null && (
                <>
                  <span>•</span>
                  <span>{t('badges.daysSinceLastContact', { days: daysSinceContact })}</span>
                </>
              )}
            </div>

            {/* Reminder note if present */}
            {Boolean(item.reminder_note) && (
              <p className="mt-1.5 text-xs text-[var(--fg-muted)] bg-[var(--surface-2)]/60 px-2 py-1 rounded-sm border border-[var(--border)]/70">
                {item.reminder_note}
              </p>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <OpenDmButton
              instagramHandle={item.instagram_handle}
              whatsappE164={item.whatsapp_e164}
              onOpened={handleDmOpened}
            />

            {/* Bucket-Aware Done Button */}
            {bucket === 'exhausted' ? (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={leadAction.isPending}
                  disabled={leadAction.isPending}
                  onClick={() => {
                    setIsExiting(true);
                    leadAction.mutate({
                      lead: leadFields,
                      action: 'mark_lost',
                      payload: { reason: 'no_reply' },
                    });
                  }}
                  className="h-8 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 border-[var(--danger)]/30"
                >
                  <XCircle className="size-3.5 me-1" />
                  <span>{t('actions.lostNoReply')}</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={leadAction.isPending}
                  disabled={leadAction.isPending}
                  onClick={() => {
                    setIsExiting(true);
                    leadAction.mutate({
                      lead: leadFields,
                      action: 'restart',
                      payload: { after_days: 30 },
                    });
                  }}
                  className="h-8 text-xs"
                >
                  <RotateCcw className="size-3.5 me-1" />
                  <span>{t('actions.retryIn30Days')}</span>
                </Button>
              </div>
            ) : bucket === 'meeting_today' ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={leadAction.isPending}
                  >
                    <span>{t('actions.meetingAction')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setIsExiting(true);
                      leadAction.mutate({ lead: leadFields, action: 'send_proposal' });
                    }}
                    className="cursor-pointer"
                  >
                    <span>{locale === 'ar' ? 'إرسال عرض' : 'Send proposal'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsExiting(true);
                      leadAction.mutate({ lead: leadFields, action: 'mark_won' });
                    }}
                    className="cursor-pointer font-semibold text-[var(--primary)]"
                  >
                    <span>{locale === 'ar' ? 'تم الاتفاق (فوز)' : 'Mark as won'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLostOpen(true)}
                    className="cursor-pointer text-[var(--danger)]"
                  >
                    <span>{locale === 'ar' ? 'تسجيل كخسارة' : 'Mark as lost'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={leadAction.isPending}
                disabled={leadAction.isPending}
                onClick={handlePrimaryDone}
                className={`h-8 gap-1.5 transition-all ${
                  highlightDone
                    ? 'ring-4 ring-[var(--primary)]/40 scale-105 shadow-md animate-pulse'
                    : ''
                }`}
              >
                {highlightDone ? (
                  <Sparkles className="size-3.5 text-amber-300 animate-spin" />
                ) : (
                  <Check className="size-3.5 stroke-[2.5]" />
                )}
                <span>
                  {bucket === 'reminder' ? t('actions.clearReminder') : t('actions.markDone')}
                </span>
              </Button>
            )}

            {/* Overflow ⋯ Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 text-[var(--fg-muted)]">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => router.push(`/leads/${item.id}`)}
                  className="gap-2 cursor-pointer"
                >
                  <ExternalLink className="size-4" />
                  <span>{locale === 'ar' ? 'فتح الملف' : 'Open lead'}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setIsExiting(true);
                    leadAction.mutate({ lead: leadFields, action: 'reply_received' });
                  }}
                  className="gap-2 cursor-pointer"
                >
                  <MessageCircle className="size-4" />
                  <span>{t('actions.replyReceived')}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setSnoozeOpen(true)}
                  className="gap-2 cursor-pointer"
                >
                  <Moon className="size-4" />
                  <span>{t('actions.snooze')}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setLostOpen(true)}
                  className="gap-2 cursor-pointer text-[var(--danger)] focus:text-[var(--danger)]"
                >
                  <XCircle className="size-4" />
                  <span>{locale === 'ar' ? 'تسجيل كخسارة' : 'Mark as lost'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SwipeableRow>

      {/* Dialogs */}
      <SnoozeMenu open={snoozeOpen} onOpenChange={setSnoozeOpen} lead={leadFields} />
      <LostReasonDialog open={lostOpen} onOpenChange={setLostOpen} lead={leadFields} />
    </div>
  );
}
