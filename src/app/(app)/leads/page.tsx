'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadsToolbar } from '@/features/leads/components/LeadsToolbar';
import { KanbanBoard } from '@/features/leads/components/KanbanBoard';
import { LeadsTable } from '@/features/leads/components/LeadsTable';
import { LeadsCardList } from '@/features/leads/components/LeadsCardList';
import { LeadsSkeleton } from '@/features/leads/components/LeadsSkeleton';
import { LeadsEmpty } from '@/features/leads/components/LeadsEmpty';
import { useLeadFilters } from '@/features/leads/filters';
import {
  useLeadsInfinite,
  useIndustries,
  useCountries,
} from '@/features/leads/queries';
import { useLeadModal } from '@/features/leads/context/lead-modal-context';
import { ExportButton, createLeadsExportSpec } from '@/features/data-hub/export';
import type { LeadSuggestion } from '@/features/leads/api';

export default function LeadsPage() {
  const router = useRouter();
  const t = useTranslations('leads');
  const { openCreateLead } = useLeadModal();
  const { filters, rawState, setFilters, resetFilters } = useLeadFilters();

  // Relate View Mode State (Kanban Board vs Dense Table)
  const [viewMode, setViewMode] = React.useState<'kanban' | 'table'>('kanban');
  const [platformFilter, setPlatformFilter] = React.useState<'all' | 'instagram' | 'whatsapp'>('all');
  const [priorityFilter, setPriorityFilter] = React.useState<'all' | 'high' | 'medium' | 'normal'>('all');

  const leadsExportSpec = React.useMemo(
    () =>
      createLeadsExportSpec({
        query: rawState.q,
        stages: filters.stages,
        industries: filters.industries,
        countries: filters.countries,
      }),
    [rawState.q, filters.stages, filters.industries, filters.countries]
  );

  // Queries
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useLeadsInfinite(filters);

  const { data: industries = [] } = useIndustries();
  const { data: countries = [] } = useCountries();

  // Flattened leads array
  const allLeads = React.useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flat();
  }, [data]);

  const hasSearch = Boolean(rawState.q && rawState.q.trim().length > 0);

  const hasActiveFilters = React.useMemo(() => {
    return Boolean(
      (filters.stages && filters.stages.length > 0) ||
        (filters.industries && filters.industries.length > 0) ||
        (filters.countries && filters.countries.length > 0) ||
        filters.due ||
        filters.has_whatsapp ||
        filters.has_content !== undefined ||
        filters.appears_in_content !== undefined ||
        (filters.has_videographer && filters.has_videographer !== 'unknown') ||
        filters.missing ||
        filters.created_from ||
        filters.created_to ||
        platformFilter !== 'all' ||
        priorityFilter !== 'all'
    );
  }, [filters, platformFilter, priorityFilter]);

  const handleLeadClick = (id: string) => {
    router.push(`/leads/${id}`);
  };

  const handleSelectSuggestion = (suggestion: LeadSuggestion) => {
    void setFilters({ q: suggestion.name });
  };

  return (
    <div className="w-full pb-16 space-y-4">
      {/* Sticky Leads Toolbar with Relate View Switcher and Action Buttons */}
      <LeadsToolbar
        isFetching={isFetching}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        platformFilter={platformFilter}
        onPlatformFilterChange={setPlatformFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        actionsSlot={
          <div className="flex items-center gap-2">
            <ExportButton spec={leadsExportSpec} />
            <Button
              type="button"
              size="sm"
              onClick={openCreateLead}
              className="hidden sm:inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-all font-semibold"
            >
              <Plus className="size-4" />
              <span>{t('createLeadTitle')}</span>
            </Button>
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="w-full">
        {isLoading ? (
          <LeadsSkeleton count={8} />
        ) : isError ? (
          <div className="px-4">
            <LeadsEmpty
              type="error"
              errorMessage={error instanceof Error ? error.message : undefined}
              onRetry={() => void refetch()}
            />
          </div>
        ) : allLeads.length === 0 ? (
          <div className="px-4">
            {hasSearch || hasActiveFilters ? (
              <LeadsEmpty
                type="no-results"
                searchQuery={rawState.q || ''}
                hasActiveFilters={hasActiveFilters}
                onClearSearch={() => void setFilters({ q: '' })}
                onClearFilters={() => {
                  resetFilters();
                  setPlatformFilter('all');
                  setPriorityFilter('all');
                }}
                onSelectSuggestion={handleSelectSuggestion}
              />
            ) : (
              <LeadsEmpty type="no-data" onAddLead={openCreateLead} />
            )}
          </div>
        ) : viewMode === 'kanban' ? (
          /* 1. Relate Kanban Pipeline Board View */
          <KanbanBoard
            leads={allLeads}
            industries={industries}
            countries={countries}
            searchQuery={rawState.q || ''}
            selectedStages={rawState.stages}
            priorityFilter={priorityFilter}
            platformFilter={platformFilter}
            onLeadClick={handleLeadClick}
          />
        ) : (
          /* 2. Dense Table View */
          <>
            {/* Desktop Table (≥md) */}
            <div className="hidden md:block px-4 sm:px-6">
              <LeadsTable
                leads={allLeads}
                searchQuery={rawState.q || ''}
                industries={industries}
                countries={countries}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={() => void fetchNextPage()}
                onLeadClick={handleLeadClick}
              />
            </div>

            {/* Mobile Card List (<md) */}
            <div className="md:hidden">
              <LeadsCardList
                leads={allLeads}
                searchQuery={rawState.q || ''}
                industries={industries}
                countries={countries}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={() => void fetchNextPage()}
                onLeadClick={handleLeadClick}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
