import * as React from 'react';
import {
  UserPlus,
  Send,
  MessageSquare,
  MessageSquareDot,
  MessageSquareDashed,
  MessageCircleReply,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type LeadStage =
  | 'new'
  | 'message_sent'
  | 'follow_up_1'
  | 'follow_up_2'
  | 'follow_up_3'
  | 'replied'
  | 'meeting_booked'
  | 'proposal_sent'
  | 'won'
  | 'lost';

interface StageMeta {
  labelAr: string;
  icon: LucideIcon;
  bgClass: string;
  fgClass: string;
}

const STAGE_CONFIG: Record<LeadStage, StageMeta> = {
  new: {
    labelAr: 'جديد',
    icon: UserPlus,
    bgClass: 'bg-[var(--stage-new-bg)]',
    fgClass: 'text-[var(--stage-new-fg)]',
  },
  message_sent: {
    labelAr: 'تم إرسال رسالة',
    icon: Send,
    bgClass: 'bg-[var(--stage-message_sent-bg)]',
    fgClass: 'text-[var(--stage-message_sent-fg)]',
  },
  follow_up_1: {
    labelAr: 'متابعة 1',
    icon: MessageSquare,
    bgClass: 'bg-[var(--stage-follow_up_1-bg)]',
    fgClass: 'text-[var(--stage-follow_up_1-fg)]',
  },
  follow_up_2: {
    labelAr: 'متابعة 2',
    icon: MessageSquareDot,
    bgClass: 'bg-[var(--stage-follow_up_2-bg)]',
    fgClass: 'text-[var(--stage-follow_up_2-fg)]',
  },
  follow_up_3: {
    labelAr: 'متابعة 3',
    icon: MessageSquareDashed,
    bgClass: 'bg-[var(--stage-follow_up_3-bg)]',
    fgClass: 'text-[var(--stage-follow_up_3-fg)]',
  },
  replied: {
    labelAr: 'تم الرد',
    icon: MessageCircleReply,
    bgClass: 'bg-[var(--stage-replied-bg)]',
    fgClass: 'text-[var(--stage-replied-fg)]',
  },
  meeting_booked: {
    labelAr: 'موعد محجوز',
    icon: Calendar,
    bgClass: 'bg-[var(--stage-meeting_booked-bg)]',
    fgClass: 'text-[var(--stage-meeting_booked-fg)]',
  },
  proposal_sent: {
    labelAr: 'عرض مرسل',
    icon: FileText,
    bgClass: 'bg-[var(--stage-proposal_sent-bg)]',
    fgClass: 'text-[var(--stage-proposal_sent-fg)]',
  },
  won: {
    labelAr: 'تم الاتفاق',
    icon: CheckCircle2,
    bgClass: 'bg-[var(--stage-won-bg)]',
    fgClass: 'text-[var(--stage-won-fg)]',
  },
  lost: {
    labelAr: 'خسارة',
    icon: XCircle,
    bgClass: 'bg-[var(--stage-lost-bg)]',
    fgClass: 'text-[var(--stage-lost-fg)]',
  },
};

export interface StageBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  stage: LeadStage;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export function StageBadge({
  stage,
  size = 'md',
  showIcon = true,
  className,
  ...props
}: StageBadgeProps) {
  const config = STAGE_CONFIG[stage] || STAGE_CONFIG.new;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] font-medium shrink-0',
        config.bgClass,
        config.fgClass,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm',
        className
      )}
      {...props}
    >
      {showIcon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      <span>{config.labelAr}</span>
    </div>
  );
}
