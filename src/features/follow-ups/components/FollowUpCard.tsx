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
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 rounded-2xl border border-border bg-card shadow-2xs hover:shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150 ${
            className || ''
          }`}
        >
          {/* Left: Lead Identity, Avatar Badge & Status */}
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            {/* Account Avatar with Platform Indicator */}
            <div className="relative shrink-0 mt-0.5">
              <div className="size-10 rounded-full flex items-center justify-center bg-muted/40 text-foreground font-bold text-sm shadow-2xs">
                {item.name.charAt(0)}
              </div>
              {item.instagram_handle ? (
                <div
                  className="absolute -bottom-1 -end-1 size-5 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-2xs ring-2 ring-card"
                  title={`@${item.instagram_handle}`}
                >
                  <span className="text-[10px] font-bold">ig</span>
                </div>
              ) : item.whatsapp_e164 ? (
                <div
                  className="absolute -bottom-1 -end-1 size-5 rounded-full flex items-center justify-center bg-[#25D366] text-white shadow-2xs ring-2 ring-card"
                  title={item.whatsapp_e164}
                >
                  <span className="text-[10px] font-bold">wa</span>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => router.push(`/leads/${item.id}`)}
                  className="font-bold text-sm sm:text-base text-foreground hover:text-primary truncate text-start transition-colors"
                >
                  {item.name}
                </button>

                <StageBadge stage={item.stage} size="sm" />

                {/* Overdue Status Pill */}
                {item.days_overdue > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-destructive/10 text-destructive border border-destructive/20 shadow-2xs">
                    <span className="size-1.5 rounded-full bg-destructive animate-pulse" />
                    <span>{t('badges.overdueDays', { count: item.days_overdue })}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 shadow-2xs">
                    <span className="size-1.5 rounded-full bg-primary" />
                    <span>{t('badges.today')}</span>
                  </span>
                )}
              </div>

              {/* Handle & Days since last contact */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                {item.instagram_handle && (
                  <span className="font-mono">@{item.instagram_handle}</span>
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

              {/* Reminder note in Primary/10 Callout */}
              {Boolean(item.reminder_note) && (
                <p className="mt-2 text-xs text-foreground bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 leading-relaxed">
                  {item.reminder_note}
                </p>
              )}
            </div>
          </div>

          {/* Right: Relate Pill Actions */}
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
                  className="h-9 px-3 rounded-full text-xs font-semibold text-destructive hover:bg-destructive/10 border border-destructive/30"
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
                  className="h-9 px-3 rounded-full text-xs font-semibold"
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
                    className="h-9 px-4 rounded-full gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs text-xs font-semibold"
                    disabled={leadAction.isPending}
                  >
                    <span>{t('actions.meetingAction')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-border bg-card rounded-xl p-1 text-xs">
                  <DropdownMenuItem
                    onClick={() => {
                      setIsExiting(true);
                      leadAction.mutate({ lead: leadFields, action: 'send_proposal' });
                    }}
                    className="cursor-pointer rounded-lg"
                  >
                    <span>{locale === 'ar' ? 'إرسال عرض' : 'Send proposal'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsExiting(true);
                      leadAction.mutate({ lead: leadFields, action: 'mark_won' });
                    }}
                    className="cursor-pointer font-semibold text-primary rounded-lg"
                  >
                    <span>{locale === 'ar' ? 'تم الاتفاق (فوز)' : 'Mark as won'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLostOpen(true)}
                    className="cursor-pointer text-destructive rounded-lg"
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
                className={`h-9 px-4 rounded-full gap-1.5 transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs text-xs sm:text-sm font-semibold ${
                  highlightDone
                    ? 'ring-4 ring-primary/40 scale-105 shadow-md animate-pulse'
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
                <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 border-border bg-card rounded-xl p-1 text-xs">
                <DropdownMenuItem
                  onClick={() => router.push(`/leads/${item.id}`)}
                  className="gap-2 cursor-pointer rounded-lg"
                >
                  <ExternalLink className="size-3.5" />
                  <span>{locale === 'ar' ? 'فتح الملف' : 'Open lead'}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setIsExiting(true);
                    leadAction.mutate({ lead: leadFields, action: 'reply_received' });
                  }}
                  className="gap-2 cursor-pointer rounded-lg"
                >
                  <MessageCircle className="size-3.5" />
                  <span>{t('actions.replyReceived')}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setSnoozeOpen(true)}
                  className="gap-2 cursor-pointer rounded-lg"
                >
                  <Moon className="size-3.5" />
                  <span>{t('actions.snooze')}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setLostOpen(true)}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg"
                >
                  <XCircle className="size-3.5" />
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
