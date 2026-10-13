'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, Kanban, Table2, Phone, Flame } from 'lucide-react';
import { InstagramIcon as Instagram } from '@/components/icons/instagram';
import { Button } from '@/components/ui/button';
import { SearchInput } from './SearchInput';
import { StageTabs } from './StageTabs';
import { FilterSheet } from './FilterSheet';
import { ActiveFilterChips } from './ActiveFilterChips';
import { SortSelect } from './SortSelect';
import { useLeadFilters } from '../filters';
import { cn } from '@/lib/utils';
import type { LeadFilters } from '../schema';

export interface LeadsToolbarProps {
  isFetching?: boolean;
  actionsSlot?: React.ReactNode;
  viewMode?: 'kanban' | 'table';
  onViewModeChange?: (mode: 'kanban' | 'table') => void;
  platformFilter?: 'all' | 'instagram' | 'whatsapp';
  onPlatformFilterChange?: (platform: 'all' | 'instagram' | 'whatsapp') => void;
  priorityFilter?: 'all' | 'high' | 'medium' | 'normal';
  onPriorityFilterChange?: (priority: 'all' | 'high' | 'medium' | 'normal') => void;
  className?: string;
}

export function LeadsToolbar({
  isFetching = false,
  actionsSlot,
  viewMode = 'kanban',
  onViewModeChange,
  platformFilter = 'all',
  onPlatformFilterChange,
  priorityFilter = 'all',
  onPriorityFilterChange,
  className,
}: LeadsToolbarProps) {
  const t = useTranslations('leads');
  const { filters, rawState, setFilters, resetFilters } = useLeadFilters();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false);

  // Calculate active filter count for the trigger badge
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.industries && filters.industries.length > 0) count += filters.industries.length;
    if (filters.countries && filters.countries.length > 0) count += filters.countries.length;
    if (filters.due) count += 1;
    if (filters.has_whatsapp) count += 1;
    if (filters.has_content !== undefined) count += 1;
    if (filters.appears_in_content !== undefined) count += 1;
    if (filters.has_videographer && filters.has_videographer !== 'unknown') count += 1;
    if (filters.missing && (Array.isArray(filters.missing) ? filters.missing.length > 0 : true)) count += 1;
    if (filters.created_from || filters.created_to) count += 1;
    if (platformFilter !== 'all') count += 1;
    if (priorityFilter !== 'all') count += 1;
    return count;
  }, [filters, platformFilter, priorityFilter]);

  const handleApplyFilters = (patch: Partial<LeadFilters>) => {
    void setFilters({
      industries: patch.industries !== undefined ? patch.industries : filters.industries || [],
      countries: patch.countries !== undefined ? patch.countries : filters.countries || [],
      due: patch.due !== undefined ? patch.due : filters.due ?? null,
      has_whatsapp: patch.has_whatsapp !== undefined ? patch.has_whatsapp : filters.has_whatsapp ?? null,
      has_content: patch.has_content !== undefined ? patch.has_content : filters.has_content ?? null,
      appears_in_content:
        patch.appears_in_content !== undefined ? patch.appears_in_content : filters.appears_in_content ?? null,
      has_videographer:
        patch.has_videographer !== undefined ? patch.has_videographer : filters.has_videographer ?? null,
      missing:
        patch.missing !== undefined
          ? Array.isArray(patch.missing)
            ? patch.missing
            : patch.missing
              ? [patch.missing]
              : []
          : filters.missing
            ? Array.isArray(filters.missing)
              ? filters.missing
              : [filters.missing]
            : [],
      created_from: patch.created_from !== undefined ? patch.created_from : filters.created_from ?? null,
      created_to: patch.created_to !== undefined ? patch.created_to : filters.created_to ?? null,
    });
  };

  return (
    <div
      className={cn(
        'sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border py-3 px-4 sm:px-6 space-y-2.5 transition-shadow',
        className
      )}
    >
      {/* Row 1: Search, View Mode Toggle, Sort, Filter Trigger & Actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Search Input */}
        <div className="flex-1 min-w-[220px]">
          <SearchInput
            value={rawState.q || ''}
            onChange={(q) => void setFilters({ q })}
            isFetching={isFetching}
          />
        </div>

        {/* Relate Pill Segmented View Mode Switcher (Kanban vs Table) */}
        {onViewModeChange && (
          <div
            role="group"
            aria-label={t('viewMode')}
            className="flex items-center p-0.5 rounded-full bg-muted/40 border border-border shrink-0 shadow-2xs"
          >
            <button
              type="button"
              onClick={() => onViewModeChange('kanban')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150',
                viewMode === 'kanban'
                  ? 'bg-card text-primary shadow-xs border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title={t('viewKanban')}
            >
              <Kanban className="size-3.5" />
              <span className="hidden sm:inline">{t('viewKanban')}</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150',
                viewMode === 'table'
                  ? 'bg-card text-primary shadow-xs border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title={t('viewTable')}
            >
              <Table2 className="size-3.5" />
              <span className="hidden sm:inline">{t('viewTable')}</span>
            </button>
          </div>
        )}

        {/* Sort Select */}
        <SortSelect
          value={rawState.sort}
          onChange={(sort) => void setFilters({ sort })}
          query={rawState.q}
        />

        {/* Filter Sheet Trigger Pill Button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsFilterSheetOpen(true)}
          className={cn(
            'h-10 px-3.5 text-xs sm:text-sm font-medium gap-1.5 shrink-0 rounded-full',
            'bg-card border-border text-foreground hover:bg-muted/40 shadow-2xs',
            activeFilterCount > 0 &&
              'border-primary text-primary bg-primary/10'
          )}
        >
          <SlidersHorizontal className="size-3.5 shrink-0" />
          <span className="hidden xs:inline">{t('filtersTitle')}</span>
          {activeFilterCount > 0 && (
            <span className="ms-1 px-1.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-primary text-primary-foreground leading-none">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Optional Actions Slot (e.g. Export, Add Lead) */}
        {actionsSlot && <div className="shrink-0">{actionsSlot}</div>}
      </div>

      {/* Row 2: Stage Tabs & Quick Filter Pills */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <StageTabs
            selectedStages={rawState.stages}
            onSelectStage={(stages) => void setFilters({ stages })}
            filters={filters}
          />
        </div>

        {/* Quick Multi-Dimensional Filter Pills (Platform & Priority) */}
        {(onPlatformFilterChange || onPriorityFilterChange) && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 shrink-0 text-xs">
            {onPlatformFilterChange && (
              <div className="flex items-center gap-1 p-0.5 rounded-full bg-muted/40 border border-border">
                <button
                  type="button"
                  onClick={() => onPlatformFilterChange('all')}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors',
                    platformFilter === 'all'
                      ? 'bg-card text-foreground shadow-xs border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => onPlatformFilterChange('instagram')}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1',
                    platformFilter === 'instagram'
                      ? 'bg-pink-500 text-white shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-pink-400'
                  )}
                  title="إنستجرام"
                >
                  <Instagram className="size-3" />
                  <span className="hidden sm:inline">إنستجرام</span>
                </button>
                <button
                  type="button"
                  onClick={() => onPlatformFilterChange('whatsapp')}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1',
                    platformFilter === 'whatsapp'
                      ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-emerald-400'
                  )}
                  title="واتساب"
                >
                  <Phone className="size-3" />
                  <span className="hidden sm:inline">واتساب</span>
                </button>
              </div>
            )}

            {onPriorityFilterChange && (
              <div className="flex items-center gap-1 p-0.5 rounded-full bg-muted/40 border border-border">
                <button
                  type="button"
                  onClick={() =>
                    onPriorityFilterChange(priorityFilter === 'high' ? 'all' : 'high')
                  }
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1',
                    priorityFilter === 'high'
                      ? 'bg-red-500 text-white shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-red-400'
                  )}
                  title="أولوية عالية"
                >
                  <Flame className="size-3" />
                  <span>عالية</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Row 3: Active Filter Chips */}
      <ActiveFilterChips
        filters={filters}
        onRemoveFilter={(patch) => handleApplyFilters(patch)}
        onClearAll={resetFilters}
      />

      {/* Responsive Filter Sheet */}
      <FilterSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={resetFilters}
      />
    </div>
  );
}
