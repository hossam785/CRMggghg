'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { LeadSort } from '../schema';

export interface SortSelectProps {
  value: LeadSort;
  onChange: (sort: LeadSort) => void;
  query?: string;
  className?: string;
}

const SORT_OPTIONS = [
  { id: 'newest', labelKey: 'sortNewest' },
  { id: 'oldest', labelKey: 'sortOldest' },
  { id: 'last_contact', labelKey: 'sortLastContact' },
  { id: 'next_follow_up', labelKey: 'sortNextFollowUp' },
  { id: 'name', labelKey: 'sortName' },
  { id: 'relevance', labelKey: 'sortRelevance' },
] as const;

export function SortSelect({
  value,
  onChange,
  query,
  className,
}: SortSelectProps) {
  const t = useTranslations('leads');
  const [isManuallyTouched, setIsManuallyTouched] = React.useState(false);

  // Auto-switch to relevance when query is non-empty and user hasn't explicitly picked a sort
  React.useEffect(() => {
    const hasQuery = Boolean(query && query.trim().length > 0);

    if (hasQuery && !isManuallyTouched && value !== 'relevance') {
      onChange('relevance');
    } else if (!hasQuery && !isManuallyTouched && value === 'relevance') {
      onChange('newest');
    }
  }, [query, isManuallyTouched, value, onChange]);

  const handleSelect = (nextVal: string) => {
    setIsManuallyTouched(true);
    onChange(nextVal as LeadSort);
  };

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <Select value={value} onValueChange={handleSelect}>
        <SelectTrigger
          aria-label={t('sortLabel')}
          className="h-10 text-xs sm:text-sm font-medium bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg)] hover:bg-[var(--surface)] px-3 min-w-[130px] sm:min-w-[145px]"
        >
          <div className="flex items-center gap-1.5 truncate">
            <ArrowUpDown className="size-3.5 text-[var(--fg-muted)] shrink-0" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent align="end" className="text-xs sm:text-sm">
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {t(opt.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
