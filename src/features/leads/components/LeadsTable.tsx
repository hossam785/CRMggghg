'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { Loader2 } from 'lucide-react';
import { LeadRow } from './LeadRow';
import { cn } from '@/lib/utils';
import type { LeadListRow } from '../schema';
import type { Industry, Country } from '../api';

export interface LeadsTableProps {
  leads: LeadListRow[];
  searchQuery?: string;
  industries?: Industry[];
  countries?: Country[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage: () => void;
  onLeadClick: (id: string) => void;
  className?: string;
}

export function LeadsTable({
  leads,
  searchQuery,
  industries = [],
  countries = [],
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  onLeadClick,
  className,
}: LeadsTableProps) {
  const t = useTranslations('leads');
  const [scrollMargin, setScrollMargin] = React.useState(0);
  const containerRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setScrollMargin(node.offsetTop);
    }
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: leads.length,
    estimateSize: () => 56, // 56px per row
    overscan: 5,
    scrollMargin,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const lastItem = virtualRows[virtualRows.length - 1];

  // Infinite scroll trigger at ~80% scroll
  React.useEffect(() => {
    if (!lastItem) return;

    if (
      lastItem.index >= leads.length - 10 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [lastItem, leads.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--surface)] overflow-hidden shadow-2xs',
        className
      )}
    >
      {/* Sticky Table Header */}
      <div
        role="row"
        className="sticky top-0 z-10 flex items-center h-11 px-4 sm:px-6 border-b border-[var(--border)] bg-[var(--surface-2)]/90 backdrop-blur-sm text-xs font-semibold text-[var(--fg-muted)] select-none"
      >
        <div className="flex-1 pe-4">{t('tableHeaders.lead')}</div>
        <div className="w-36 shrink-0">{t('tableHeaders.stage')}</div>
        <div className="w-48 shrink-0">{t('tableHeaders.industryAndCountry')}</div>
        <div className="w-32 shrink-0">{t('tableHeaders.lastContact')}</div>
        <div className="w-32 shrink-0">{t('tableHeaders.nextFollowUp')}</div>
        <div className="w-10 shrink-0" />
      </div>

      {/* Virtualized Rows Container */}
      <div
        className="relative w-full"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualRows.map((virtualRow) => {
          const lead = leads[virtualRow.index];
          if (!lead) return null;

          return (
            <div
              key={lead.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 start-0 w-full"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start - (virtualizer.options.scrollMargin || 0)}px)`,
              }}
            >
              <LeadRow
                lead={lead}
                searchQuery={searchQuery}
                industries={industries}
                countries={countries}
                onClick={() => onLeadClick(lead.id)}
              />
            </div>
          );
        })}
      </div>

      {/* Loading Next Page Spinner */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center p-4 border-t border-[var(--border)] bg-[var(--surface-2)]/30 text-xs text-[var(--fg-muted)] gap-2">
          <Loader2 className="size-4 animate-spin text-[var(--primary)]" />
          <span>جاري تحميل المزيد من العملاء…</span>
        </div>
      )}
    </div>
  );
}
