'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Layers,
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
import type { LeadStage } from '@/types/database';
import { LEAD_STAGES } from '../filters';
import { useStageCounts } from '../queries';
import type { LeadFilters } from '../schema';

const STAGE_ICONS: Record<LeadStage, LucideIcon> = {
  new: UserPlus,
  message_sent: Send,
  follow_up_1: MessageSquare,
  follow_up_2: MessageSquareDot,
  follow_up_3: MessageSquareDashed,
  replied: MessageCircleReply,
  meeting_booked: Calendar,
  proposal_sent: FileText,
  won: CheckCircle2,
  lost: XCircle,
};

export interface StageTabsProps {
  selectedStages?: LeadStage[];
  onSelectStage: (stages: LeadStage[]) => void;
  filters: LeadFilters;
  className?: string;
}

export function StageTabs({
  selectedStages = [],
  onSelectStage,
  filters,
  className,
}: StageTabsProps) {
  const tLeads = useTranslations('leads');
  const tStages = useTranslations('stages');
  const locale = useLocale();

  // Query counts for all stages given current filters (excluding stages filter itself)
  const filtersWithoutStages = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { stages: _stages, ...rest } = filters;
    return rest;
  }, [filters]);

  const { data: stageCountsData } = useStageCounts(filtersWithoutStages);

  const countsMap = React.useMemo(() => {
    const map: Partial<Record<LeadStage, number>> = {};
    if (stageCountsData) {
      for (const item of stageCountsData) {
        map[item.stage] = item.total;
      }
    }
    return map;
  }, [stageCountsData]);

  const totalAll = React.useMemo(() => {
    if (!stageCountsData) return 0;
    return stageCountsData.reduce((acc, curr) => acc + (curr.total || 0), 0);
  }, [stageCountsData]);

  const numberFormatter = React.useMemo(() => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US');
  }, [locale]);

  const isAllActive = selectedStages.length === 0;
  const activeStage = selectedStages.length === 1 ? selectedStages[0] : null;

  const activeTabRef = React.useRef<HTMLButtonElement | null>(null);

  // Scroll active tab into view horizontally with smooth snap
  React.useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'nearest',
        block: 'nearest',
      });
    }
  }, [selectedStages]);

  return (
    <div className={cn('relative w-full overflow-hidden', className)}>
      <div
        role="tablist"
        aria-label={tLeads('allStages')}
        className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory scroll-smooth"
      >
        {/* All Tab */}
        <button
          ref={isAllActive ? activeTabRef : null}
          type="button"
          role="tab"
          aria-selected={isAllActive}
          onClick={() => onSelectStage([])}
          className={cn(
            'snap-start shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all duration-150 select-none',
            isAllActive
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
          )}
        >
          <Layers className="size-3.5 shrink-0" aria-hidden="true" />
          <span>{tLeads('allStages')}</span>
          <span
            className={cn(
              'ms-1 px-1.5 py-0.5 rounded-full text-[11px] font-mono leading-none',
              isAllActive
                ? 'bg-primary-foreground/25 text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {numberFormatter.format(totalAll)}
          </span>
        </button>

        {/* 10 Individual Stage Tabs */}
        {LEAD_STAGES.map((stage) => {
          const isSelected = activeStage === stage;
          const count = countsMap[stage] ?? 0;
          const Icon = STAGE_ICONS[stage];

          return (
            <button
              key={stage}
              ref={isSelected ? activeTabRef : null}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectStage([stage])}
              className={cn(
                'snap-start shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all duration-150 select-none',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{tStages(stage)}</span>
              <span
                className={cn(
                  'ms-1 px-1.5 py-0.5 rounded-full text-[11px] font-mono leading-none',
                  isSelected
                    ? 'bg-primary-foreground/25 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {numberFormatter.format(count)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
