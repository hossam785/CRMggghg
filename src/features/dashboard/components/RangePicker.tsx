'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { DashboardRange } from '../types';

const RANGES: { key: DashboardRange; labelAr: string; labelEn: string }[] = [
  { key: 'today', labelAr: 'اليوم', labelEn: 'Today' },
  { key: '7d', labelAr: 'آخر 7 أيام', labelEn: '7 Days' },
  { key: '30d', labelAr: 'آخر 30 يوم', labelEn: '30 Days' },
  { key: 'this_month', labelAr: 'هذا الشهر', labelEn: 'This Month' },
  { key: 'all', labelAr: 'كل الوقت', labelEn: 'All Time' },
];

interface RangePickerProps {
  currentRange: DashboardRange;
}

export function RangePicker({ currentRange }: RangePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (range: DashboardRange) => {
    const params = new URLSearchParams(searchParams.toString());
    if (range === '30d') {
      params.delete('range');
    } else {
      params.set('range', range);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    router.push(`/${query}`);
  };

  return (
    <div className="inline-flex items-center p-1 rounded-2xl bg-muted/60 border border-border/80 shadow-xs">
      {RANGES.map((r) => {
        const isActive = currentRange === r.key;
        return (
          <button
            key={r.key}
            type="button"
            onClick={() => handleSelect(r.key)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-150 ${
              isActive
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
            }`}
          >
            {r.labelAr}
          </button>
        );
      })}
    </div>
  );
}
