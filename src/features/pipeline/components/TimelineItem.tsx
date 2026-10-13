'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  UserPlus,
  Send,
  Clock,
  MessageCircle,
  Calendar,
  FileText,
  Trophy,
  XCircle,
  SlidersHorizontal,
  RotateCcw,
  Bell,
  Moon,
  RefreshCw,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useUndo } from '../use-undo';
import { type LeadEventRow } from '../api';
import { type LeadEventType } from '@/types/database';

export interface TimelineItemProps {
  event: LeadEventRow;
  isLatest: boolean;
}

const EVENT_ICONS: Record<
  LeadEventType,
  {
    icon: React.ComponentType<{ className?: string }>;
    bgClass: string;
    fgClass: string;
  }
> = {
  created: {
    icon: UserPlus,
    bgClass: 'bg-blue-500/10',
    fgClass: 'text-blue-500',
  },
  message_sent: {
    icon: Send,
    bgClass: 'bg-sky-500/10',
    fgClass: 'text-sky-500',
  },
  follow_up_sent: {
    icon: Clock,
    bgClass: 'bg-amber-500/10',
    fgClass: 'text-amber-500',
  },
  reply_received: {
    icon: MessageCircle,
    bgClass: 'bg-purple-500/10',
    fgClass: 'text-purple-500',
  },
  meeting_booked: {
    icon: Calendar,
    bgClass: 'bg-indigo-500/10',
    fgClass: 'text-indigo-500',
  },
  proposal_sent: {
    icon: FileText,
    bgClass: 'bg-teal-500/10',
    fgClass: 'text-teal-500',
  },
  won: {
    icon: Trophy,
    bgClass: 'bg-emerald-500/10',
    fgClass: 'text-emerald-500',
  },
  lost: {
    icon: XCircle,
    bgClass: 'bg-destructive/10',
    fgClass: 'text-destructive',
  },
  stage_set: {
    icon: SlidersHorizontal,
    bgClass: 'bg-muted/40',
    fgClass: 'text-foreground',
  },
  reopened: {
    icon: RotateCcw,
    bgClass: 'bg-muted/40',
    fgClass: 'text-foreground',
  },
  reminder_set: {
    icon: Bell,
    bgClass: 'bg-primary/10',
    fgClass: 'text-primary',
  },
  snoozed: {
    icon: Moon,
    bgClass: 'bg-primary/10',
    fgClass: 'text-primary',
  },
  restarted: {
    icon: RefreshCw,
    bgClass: 'bg-muted/40',
    fgClass: 'text-foreground',
  },
};

function formatRelativeTime(dateStr: string, locale: string): string {
  try {
    const diffSeconds = Math.round((new Date(dateStr).getTime() - Date.now()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      numeric: 'auto',
    });

    const absSec = Math.abs(diffSeconds);
    if (absSec < 60) return rtf.format(diffSeconds, 'second');
    const diffMinutes = Math.round(diffSeconds / 60);
    if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');
    const diffHours = Math.round(diffMinutes / 60);
    if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
    const diffDays = Math.round(diffHours / 24);
    if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day');
    const diffMonths = Math.round(diffDays / 30);
    return rtf.format(diffMonths, 'month');
  } catch {
    return dateStr.split('T')[0] ?? '';
  }
}

export function TimelineItem({ event, isLatest }: TimelineItemProps) {
  const t = useTranslations();
  const locale = useLocale();
  const undo = useUndo();

  const isUndone = Boolean(event.undone_at);

  const [isExpired, setIsExpired] = React.useState(() => {
    const ageMs = Date.now() - new Date(event.occurred_at).getTime();
    return ageMs >= 10 * 60 * 1000;
  });

  React.useEffect(() => {
    if (isExpired || !isLatest || isUndone) return;
    const ageMs = Date.now() - new Date(event.occurred_at).getTime();
    const remainingMs = Math.max(0, 10 * 60 * 1000 - ageMs);
    const timer = setTimeout(() => setIsExpired(true), remainingMs);
    return () => clearTimeout(timer);
  }, [isExpired, isLatest, isUndone, event.occurred_at]);

  const config =
    EVENT_ICONS[event.type as LeadEventType] || EVENT_ICONS.created;
  const Icon = config.icon;

  const meta = (typeof event.meta === 'object' && event.meta !== null ? event.meta : {}) as Record<string, unknown>;

  // Build localized description
  const renderDescription = () => {
    switch (event.type) {
      case 'follow_up_sent': {
        const count =
          typeof meta.follow_up_number === 'number'
            ? meta.follow_up_number
            : typeof meta.follow_ups_sent === 'number'
            ? meta.follow_ups_sent
            : 1;
        return t('timeline.events.follow_up_sent', { count });
      }
      case 'meeting_booked': {
        if (meta.meeting_at && typeof meta.meeting_at === 'string') {
          try {
            const formattedDate = new Intl.DateTimeFormat(
              locale === 'ar' ? 'ar-EG' : 'en-US',
              { dateStyle: 'medium', timeStyle: 'short' }
            ).format(new Date(meta.meeting_at));
            return t('timeline.events.meeting_booked_at', {
              meetingAt: formattedDate,
            });
          } catch {
            return t('timeline.events.meeting_booked');
          }
        }
        return t('timeline.events.meeting_booked');
      }
      case 'lost': {
        if (meta.reason && typeof meta.reason === 'string') {
          const reasonKey = `dialogs.lostReason.reasons.${meta.reason}`;
          return t('timeline.events.lost_with_reason', {
            reason: t(reasonKey as Parameters<typeof t>[0]),
          });
        }
        return t('timeline.events.lost');
      }
      case 'stage_set': {
        const fromStage = event.from_stage ?? (meta.from_stage as string | undefined) ?? 'new';
        const toStage = event.to_stage ?? (meta.to_stage as string | undefined) ?? 'new';
        const fromKey = `stages.${fromStage}`;
        const toKey = `stages.${toStage}`;
        return t('timeline.events.stage_set', {
          from: t(fromKey as Parameters<typeof t>[0]),
          to: t(toKey as Parameters<typeof t>[0]),
        });
      }
      case 'reminder_set': {
        const dateStr = typeof meta.reminder_on === 'string' ? meta.reminder_on : '';
        return t('timeline.events.reminder_set', { date: dateStr });
      }
      case 'snoozed': {
        const days = typeof meta.days === 'number' ? meta.days : 1;
        return t('timeline.events.snoozed', { days });
      }
      case 'created':
      case 'message_sent':
      case 'reply_received':
      case 'proposal_sent':
      case 'won':
      case 'reopened':
      case 'restarted':
      default: {
        const key = `timeline.events.${event.type}`;
        return t(key as Parameters<typeof t>[0]);
      }
    }
  };

  const showUndo = isLatest && !isUndone && !isExpired;
  const fullDateFormatted = new Date(event.occurred_at).toLocaleString(
    locale === 'ar' ? 'ar-EG' : 'en-US'
  );
  const relativeTime = formatRelativeTime(event.occurred_at, locale);

  return (
    <div className="relative flex items-start gap-3 pb-6 group">
      {/* Event Icon Node */}
      <div
        className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-border shadow-2xs ${
          isUndone ? 'bg-muted/40 text-muted-foreground' : `${config.bgClass} ${config.fgClass}`
        }`}
      >
        <Icon className="size-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${
                isUndone
                  ? 'line-through text-muted-foreground'
                  : 'text-foreground'
              }`}
            >
              {renderDescription()}
            </span>

            {isUndone && (
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted/40 text-muted-foreground border border-border">
                {t('timeline.undone')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <time
                  dateTime={event.occurred_at}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-default"
                >
                  {relativeTime}
                </time>
              </TooltipTrigger>
              <TooltipContent side="top">
                <span>{fullDateFormatted}</span>
              </TooltipContent>
            </Tooltip>

            {showUndo && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={undo.isPending}
                disabled={undo.isPending}
                onClick={() => undo.mutate(event.id)}
                className="rounded-full h-7 px-2.5 text-xs gap-1 border-border bg-card hover:bg-muted/40 text-foreground shadow-2xs"
              >
                <Undo2 className="size-3" />
                <span>{t('timeline.undo')}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Note if reminder or notes present */}
        {Boolean(meta.note) && typeof meta.note === 'string' && (
          <p className="mt-1.5 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border">
            {meta.note}
          </p>
        )}
      </div>
    </div>
  );
}
