'use client';

import * as React from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { Loader2 } from 'lucide-react';
import { LeadCard } from './LeadCard';
import { cn } from '@/lib/utils';
import type { LeadListRow } from '../schema';
import type { Industry, Country } from '../api';

export interface LeadsCardListProps {
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

export function LeadsCardList({
  leads,
  searchQuery,
  industries = [],
  countries = [],
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  onLeadClick,
  className,
}: LeadsCardListProps) {
  const [scrollMargin, setScrollMargin] = React.useState(0);
  const containerRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setScrollMargin(node.offsetTop);
    }
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: leads.length,
    estimateSize: () => 140, // estimated card height
    overscan: 3,
    scrollMargin,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const lastItem = virtualRows[virtualRows.length - 1];

  // Infinite scroll trigger
  React.useEffect(() => {
    if (!lastItem) return;

    if (
      lastItem.index >= leads.length - 6 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [lastItem, leads.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div ref={containerRef} className={cn('w-full px-3 sm:px-4', className)}>
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
              className="absolute top-0 start-0 w-full pb-3"
              style={{
                transform: `translateY(${virtualRow.start - (virtualizer.options.scrollMargin || 0)}px)`,
              }}
            >
              <LeadCard
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

      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span>جاري تحميل المزيد…</span>
        </div>
      )}
    </div>
  );
}
