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
    <div
      role="tablist"
      aria-label="الفترة الزمنية للوحة المؤشرات"
      className="inline-flex items-center p-1 rounded-full bg-muted/40 border border-border shadow-xs"
    >
      {RANGES.map((r) => {
        const isActive = currentRange === r.key;
        return (
          <button
            key={r.key}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            type="button"
            onClick={() => handleSelect(r.key)}
            className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all duration-150 cursor-pointer ${
              isActive
                ? 'bg-card text-primary shadow-xs border border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
            }`}
          >
            {r.labelAr}
          </button>
        );
      })}
    </div>
  );
}
