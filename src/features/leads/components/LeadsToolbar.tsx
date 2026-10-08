'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal } from 'lucide-react';
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
  className?: string;
}

export function LeadsToolbar({
  isFetching = false,
  actionsSlot,
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
    return count;
  }, [filters]);

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
        'sticky top-0 z-20 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] py-3 px-4 sm:px-6 space-y-2.5 transition-shadow',
        className
      )}
    >
      {/* Row 1: Search, Sort, Filter Trigger & Actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            value={rawState.q || ''}
            onChange={(q) => void setFilters({ q })}
            isFetching={isFetching}
          />
        </div>

        {/* Sort Select */}
        <SortSelect
          value={rawState.sort}
          onChange={(sort) => void setFilters({ sort })}
          query={rawState.q}
        />

        {/* Filter Sheet Trigger */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsFilterSheetOpen(true)}
          className={cn(
            'h-10 px-3 text-xs sm:text-sm font-medium gap-1.5 shrink-0 bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg)] hover:bg-[var(--surface)]',
            activeFilterCount > 0 && 'border-[var(--primary)] text-[var(--primary)]'
          )}
        >
          <SlidersHorizontal className="size-4 shrink-0" />
          <span className="hidden xs:inline">{t('filtersTitle')}</span>
          {activeFilterCount > 0 && (
            <span className="ms-1 px-1.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[var(--primary)] text-white leading-none">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Optional Actions Slot (e.g. Export, Add Lead) */}
        {actionsSlot && <div className="shrink-0">{actionsSlot}</div>}
      </div>

      {/* Row 2: Stage Tabs */}
      <StageTabs
        selectedStages={rawState.stages}
        onSelectStage={(stages) => void setFilters({ stages })}
        filters={filters}
      />

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
