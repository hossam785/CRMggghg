'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MoreHorizontal,
  Plus,
  Phone,
  Flame,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { InstagramIcon as Instagram } from '@/components/icons/instagram';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { STAGE_LIST } from '@/features/pipeline/stages';
import { useLeadAction } from '@/features/pipeline/use-lead-action';
import { PrimaryActionButton } from '@/features/pipeline/components/PrimaryActionButton';
import { useLeadModal } from '../context/lead-modal-context';
import { getCountryFlag } from './fields/CountryCombobox';
import { cn } from '@/lib/utils';
import type { LeadStage } from '@/types/database';
import type { LeadListRow } from '../schema';
import type { Industry, Country } from '../api';

export interface KanbanBoardProps {
  leads: LeadListRow[];
  industries?: Industry[];
  countries?: Country[];
  searchQuery?: string;
  selectedStages?: LeadStage[];
  priorityFilter?: 'all' | 'high' | 'medium' | 'normal';
  platformFilter?: 'all' | 'instagram' | 'whatsapp';
  onLeadClick?: (id: string) => void;
  className?: string;
}

// 5px Status Dot Color Tokens per Relate Design Specification
const STAGE_DOT_COLORS: Record<LeadStage, { dot: string; glow: string; text: string }> = {
  new: {
    dot: 'bg-[#3b82f6]',
    glow: 'ring-[#3b82f6]/30',
    text: 'text-[#3b82f6]',
  },
  message_sent: {
    dot: 'bg-[#ffa64d]',
    glow: 'ring-[#ffa64d]/30',
    text: 'text-[#ffa64d]',
  },
  follow_up_1: {
    dot: 'bg-[#ffa64d]',
    glow: 'ring-[#ffa64d]/30',
    text: 'text-[#ffa64d]',
  },
  follow_up_2: {
    dot: 'bg-[#f59e0b]',
    glow: 'ring-[#f59e0b]/30',
    text: 'text-[#f59e0b]',
  },
  follow_up_3: {
    dot: 'bg-[#d97706]',
    glow: 'ring-[#d97706]/30',
    text: 'text-[#d97706]',
  },
  replied: {
    dot: 'bg-[#145aff]',
    glow: 'ring-[#145aff]/30',
    text: 'text-[#145aff]',
  },
  meeting_booked: {
    dot: 'bg-[#2563eb]',
    glow: 'ring-[#2563eb]/30',
    text: 'text-[#2563eb]',
  },
  proposal_sent: {
    dot: 'bg-[#1d4ed8]',
    glow: 'ring-[#1d4ed8]/30',
    text: 'text-[#1d4ed8]',
  },
  won: {
    dot: 'bg-[#16ca2e]',
    glow: 'ring-[#16ca2e]/30',
    text: 'text-[#16ca2e]',
  },
  lost: {
    dot: 'bg-[#f26052]',
    glow: 'ring-[#f26052]/30',
    text: 'text-[#f26052]',
  },
};

/**
 * Deterministic estimated deal value for visual pipeline metrics.
 */
export function getEstimatedDealValue(lead: LeadListRow): number {
  let hash = 0;
  const str = lead.id + lead.name;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  const base = 15000 + (positive % 55000);
  return Math.round(base / 1000) * 1000;
}

/**
 * Calculates priority score/level based on due date, stage, and follow-ups.
 */
export function getLeadPriority(lead: LeadListRow): 'high' | 'medium' | 'normal' {
  if (lead.next_follow_up_on) {
    const todayStr = new Date().toISOString().split('T')[0] ?? '';
    if (lead.next_follow_up_on <= todayStr) return 'high';
  }
  if (['meeting_booked', 'proposal_sent'].includes(lead.stage) || lead.follow_ups_sent >= 2) {
    return 'high';
  }
  if (['replied', 'follow_up_1', 'follow_up_2'].includes(lead.stage)) {
    return 'medium';
  }
  return 'normal';
}

export function KanbanBoard({
  leads,
  industries = [],
  countries = [],
  searchQuery = '',
  selectedStages = [],
  priorityFilter = 'all',
  platformFilter = 'all',
  onLeadClick,
  className,
}: KanbanBoardProps) {
  const router = useRouter();
  const tLeads = useTranslations('leads');
  const tStages = useTranslations('stages');
  const locale = useLocale();
  const { openCreateLead } = useLeadModal();
  const leadAction = useLeadAction();

  // Drag and drop state
  const [draggedLeadId, setDraggedLeadId] = React.useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = React.useState<LeadStage | null>(null);

  // Currency formatter
  const currencyFormatter = React.useMemo(() => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    });
  }, [locale]);

  const numberFormatter = React.useMemo(() => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US');
  }, [locale]);

  // Filter leads based on priority and platform if applied
  const filteredLeads = React.useMemo(() => {
    return leads.filter((lead) => {
      if (priorityFilter !== 'all') {
        const priority = getLeadPriority(lead);
        if (priority !== priorityFilter) return false;
      }
      if (platformFilter === 'instagram' && !lead.instagram_handle) {
        return false;
      }
      if (platformFilter === 'whatsapp' && !lead.whatsapp_e164) {
        return false;
      }
      return true;
    });
  }, [leads, priorityFilter, platformFilter]);

  // Group leads by stage
  const leadsByStage = React.useMemo(() => {
    const map: Record<LeadStage, LeadListRow[]> = {
      new: [],
      message_sent: [],
      follow_up_1: [],
      follow_up_2: [],
      follow_up_3: [],
      replied: [],
      meeting_booked: [],
      proposal_sent: [],
      won: [],
      lost: [],
    };

    for (const lead of filteredLeads) {
      if (map[lead.stage]) {
        map[lead.stage].push(lead);
      } else {
        map.new.push(lead);
      }
    }
    return map;
  }, [filteredLeads]);

  // Determine which stages to display (if user filtered via tabs, show those; otherwise all)
  const visibleStages = React.useMemo(() => {
    if (selectedStages.length > 0) {
      return STAGE_LIST.filter((s) => selectedStages.includes(s.key));
    }
    return STAGE_LIST;
  }, [selectedStages]);

  // Card click handler opens the intercepting panel (@panel/(.)[id])
  const handleCardClick = (leadId: string) => {
    if (onLeadClick) {
      onLeadClick(leadId);
    } else {
      router.push(`/leads/${leadId}`);
    }
  };

  // Drag start handler
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, lead: LeadListRow) => {
    e.dataTransfer.setData('text/plain', lead.id);
    e.dataTransfer.setData('application/json', JSON.stringify({ leadId: lead.id, fromStage: lead.stage }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(lead.id);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  // Drag over stage column
  const handleDragOverColumn = (e: React.DragEvent<HTMLDivElement>, stageKey: LeadStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageKey) {
      setDragOverStage(stageKey);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent<HTMLDivElement>, stageKey: LeadStage) => {
    // Check if we are actually leaving the column
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      if (dragOverStage === stageKey) {
        setDragOverStage(null);
      }
    }
  };

  // Drop handler
  const handleDropOnColumn = (e: React.DragEvent<HTMLDivElement>, targetStage: LeadStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (!leadId) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === targetStage) return;

    // Trigger instant optimistic stage change via useLeadAction
    leadAction.mutate({
      lead,
      action: 'set_stage',
      payload: { to_stage: targetStage },
    });
  };

  return (
    <div
      className={cn(
        'w-full overflow-x-auto pb-8 pt-2 select-none [scrollbar-width:thin] scroll-smooth',
        className
      )}
    >
      <div className="flex items-start gap-4 min-w-max px-4 sm:px-6">
        {visibleStages.map((stage) => {
          const stageLeads = leadsByStage[stage.key] || [];
          const isOver = dragOverStage === stage.key;
          const dotInfo = STAGE_DOT_COLORS[stage.key];

          // Calculate total deal value in column
          const totalColumnValue = stageLeads.reduce(
            (acc, curr) => acc + getEstimatedDealValue(curr),
            0
          );

          return (
            <div
              key={stage.key}
              role="region"
              aria-label={tStages(stage.key)}
              aria-dropeffect="move"
              onDragOver={(e) => handleDragOverColumn(e, stage.key)}
              onDragLeave={(e) => handleDragLeaveColumn(e, stage.key)}
              onDrop={(e) => handleDropOnColumn(e, stage.key)}
              className={cn(
                'w-[315px] shrink-0 rounded-[16px] transition-all duration-200 flex flex-col',
                'bg-muted/30 border border-border/80 p-3 min-h-[580px]',
                isOver && 'ring-2 ring-primary/80 bg-primary/5 border-primary/40'
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 pt-1 px-1 border-b border-border/80 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Status dot */}
                  <span
                    className={cn(
                      'size-[6px] rounded-full shrink-0 ring-4',
                      dotInfo.dot,
                      dotInfo.glow
                    )}
                    aria-hidden="true"
                  />
                  <h3 className="font-semibold text-sm text-foreground truncate">
                    {tStages(stage.key)}
                  </h3>
                  {/* Pill count badge */}
                  <span className="ms-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-card text-muted-foreground border border-border shadow-2xs">
                    {numberFormatter.format(stageLeads.length)}
                  </span>
                </div>

                {/* Aggregated value header hint */}
                {totalColumnValue > 0 && (
                  <span className="text-[11px] font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    {currencyFormatter.format(totalColumnValue)}
                  </span>
                )}
              </div>

              {/* Cards Container */}
              <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-250px)] pe-0.5 [scrollbar-width:thin]">
                {stageLeads.length === 0 ? (
                  <div
                    className={cn(
                      'flex-1 flex flex-col items-center justify-center p-6 text-center rounded-[8px]',
                      'border border-dashed border-border/70 text-muted-foreground text-xs gap-1.5 transition-colors',
                      isOver && 'border-primary bg-primary/10 text-primary font-medium'
                    )}
                  >
                    {isOver ? (
                      <span>{tLeads('dropHere')}</span>
                    ) : (
                      <span>{tLeads('emptyStageLeads')}</span>
                    )}
                  </div>
                ) : (
                  stageLeads.map((lead) => {
                    const isDragging = draggedLeadId === lead.id;
                    const dealValue = getEstimatedDealValue(lead);
                    const priority = getLeadPriority(lead);

                    // Industry label
                    const indMatch = industries.find((i) => i.id === lead.industry_id);
                    const indLabel = lead.industry_other
                      ? lead.industry_other
                      : indMatch
                      ? locale === 'ar'
                        ? indMatch.label_ar
                        : indMatch.label_en
                      : null;

                    return (
                      <KanbanDealCard
                        key={lead.id}
                        lead={lead}
                        dealValue={dealValue}
                        priority={priority}
                        industryLabel={indLabel}
                        currencyFormatter={currencyFormatter}
                        isDragging={isDragging}
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleCardClick(lead.id)}
                      />
                    );
                  })
                )}
              </div>

              {/* Bottom Quick Add Pill Button */}
              {stage.key === 'new' && (
                <button
                  type="button"
                  onClick={openCreateLead}
                  className="mt-3 w-full py-2 px-3 rounded-full border border-dashed border-border bg-muted/20 text-muted-foreground hover:text-primary hover:border-primary hover:bg-muted/40 text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <Plus className="size-3.5" />
                  <span>{tLeads('createLeadTitle')}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface KanbanDealCardProps {
  lead: LeadListRow;
  dealValue: number;
  priority: 'high' | 'medium' | 'normal';
  industryLabel: string | null;
  currencyFormatter: Intl.NumberFormat;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onClick: () => void;
}

function KanbanDealCard({
  lead,
  dealValue,
  priority,
  industryLabel,
  currencyFormatter,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}: KanbanDealCardProps) {
  const tLeads = useTranslations('leads');
  const tStages = useTranslations('stages');
  const leadAction = useLeadAction();
  const router = useRouter();

  const handleStageChange = (targetStage: LeadStage) => {
    leadAction.mutate({
      lead,
      action: 'set_stage',
      payload: { to_stage: targetStage },
    });
  };

  const isOverdue = React.useMemo(() => {
    if (!lead.next_follow_up_on) return false;
    const todayStr = new Date().toISOString().split('T')[0] ?? '';
    return lead.next_follow_up_on <= todayStr;
  }, [lead.next_follow_up_on]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-grabbed={isDragging}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'group relative rounded-[8px] p-3 text-start transition-all duration-150',
        'bg-card border border-border',
        'shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-border/90 cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40 scale-95 ring-2 ring-primary'
      )}
    >
      {/* Top Row: Account Avatar/Platform + Name + Stage Move Dropdown */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Platform Icon Badge */}
          {lead.instagram_handle ? (
            <div
              className="size-7 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-2xs"
              title={`@${lead.instagram_handle}`}
            >
              <Instagram className="size-3.5 fill-current" />
            </div>
          ) : lead.whatsapp_e164 ? (
            <div
              className="size-7 rounded-full flex items-center justify-center shrink-0 bg-[#25D366] text-white shadow-2xs"
              title={lead.whatsapp_e164}
            >
              <Phone className="size-3.5" />
            </div>
          ) : (
            <div className="size-7 rounded-full flex items-center justify-center shrink-0 bg-muted text-muted-foreground font-bold text-xs">
              {lead.name.charAt(0)}
            </div>
          )}

          <div className="min-w-0">
            <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {lead.name}
            </h4>
            {lead.company ? (
              <p className="text-[11px] text-muted-foreground truncate">
                {lead.company}
              </p>
            ) : industryLabel ? (
              <p className="text-[11px] text-muted-foreground truncate">
                {industryLabel}
              </p>
            ) : null}
          </div>
        </div>

        {/* More Actions Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-70 group-hover:opacity-100"
          >
            <MoreHorizontal className="size-3.5" />
            <span className="sr-only">Options</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 text-xs bg-popover border-border">
            <DropdownMenuLabel className="text-[10px] text-muted-foreground px-2 py-1">
              {tLeads('moveToStage')}
            </DropdownMenuLabel>
            {STAGE_LIST.map((s) => (
              <DropdownMenuItem
                key={s.key}
                disabled={s.key === lead.stage}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStageChange(s.key);
                }}
                className={cn(
                  'flex items-center justify-between cursor-pointer rounded-lg px-2 py-1.5',
                  s.key === lead.stage && 'bg-muted font-semibold text-primary'
                )}
              >
                <span>{tStages(s.key)}</span>
                {s.key === lead.stage && <CheckCircle2 className="size-3 text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/leads/${lead.id}`);
              }}
              className="cursor-pointer text-primary font-medium"
            >
              <span>{tLeads('openFullPage')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Middle Row: Relate Deal Value + Priority Score Pill */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/70">
        {/* Deal Value with Primary Accent */}
        <div className="flex items-center gap-1 font-mono font-bold text-xs sm:text-sm text-primary">
          <span>{currencyFormatter.format(dealValue)}</span>
        </div>

        {/* Priority Score Pill */}
        <div className="flex items-center gap-1">
          {priority === 'high' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
              <Flame className="size-3 text-red-500 fill-current" />
              <span>عالية</span>
            </span>
          ) : priority === 'medium' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span>متوسطة</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border/50">
              <span>عادية</span>
            </span>
          )}
        </div>
      </div>

      {/* Bottom Row: Next Follow-up / Overdue Badge + Primary Quick Action Pill */}
      <div className="flex items-center justify-between gap-1 mt-2.5 pt-1">
        {/* Due / Follow-up Status */}
        {lead.next_follow_up_on ? (
          <div
            className={cn(
              'inline-flex items-center gap-1 text-[11px] font-medium truncate',
              isOverdue
                ? 'text-red-400 font-semibold'
                : 'text-muted-foreground'
            )}
            title={lead.next_follow_up_on}
          >
            {isOverdue ? (
              <AlertTriangle className="size-3 text-red-500 shrink-0" />
            ) : (
              <Clock className="size-3 text-muted-foreground shrink-0" />
            )}
            <span>{isOverdue ? 'مستحقة الآن' : lead.next_follow_up_on}</span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground/70">
            {lead.country_code ? `${getCountryFlag(lead.country_code)} ${lead.country_code}` : '—'}
          </span>
        )}

        {/* Quick Action Button Pill */}
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <PrimaryActionButton
            lead={lead}
            size="sm"
            className="h-7 px-2.5 text-[11px] rounded-full shadow-2xs"
          />
        </div>
      </div>
    </div>
  );
}
