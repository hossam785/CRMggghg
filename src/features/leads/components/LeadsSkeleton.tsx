'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface LeadsSkeletonProps {
  count?: number;
  className?: string;
}

export function LeadsSkeleton({ count = 8, className }: LeadsSkeletonProps) {
  const items = Array.from({ length: count });

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop Table Skeleton (md+) */}
      <div className="hidden md:block border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--surface)] overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center h-11 px-6 border-b border-[var(--border)] bg-[var(--surface-2)]/60">
          <Skeleton className="h-4 w-28 me-auto" />
          <Skeleton className="h-4 w-20 shrink-0 me-12" />
          <Skeleton className="h-4 w-24 shrink-0 me-12" />
          <Skeleton className="h-4 w-20 shrink-0 me-8" />
          <Skeleton className="h-4 w-20 shrink-0" />
        </div>

        {/* 8 Rows */}
        <div className="divide-y divide-[var(--border)]">
          {items.map((_, i) => (
            <div key={i} className="flex items-center h-14 px-6">
              {/* Col 1 */}
              <div className="flex flex-col gap-1.5 flex-1 pe-4">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>

              {/* Col 2 */}
              <div className="w-36 shrink-0">
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>

              {/* Col 3 */}
              <div className="w-48 shrink-0 flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
              </div>

              {/* Col 4 */}
              <div className="w-32 shrink-0 flex flex-col gap-1">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-2.5 w-12" />
              </div>

              {/* Col 5 */}
              <div className="w-32 shrink-0">
                <Skeleton className="h-3.5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Card Skeleton (<md) */}
      <div className="md:hidden space-y-3 px-3">
        {items.map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>

            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-24 rounded-sm" />
              <Skeleton className="h-6 w-28 rounded-sm" />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
