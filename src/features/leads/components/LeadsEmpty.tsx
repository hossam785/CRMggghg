'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Users,
  SearchX,
  Plus,
  RotateCcw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSuggest } from '../queries';
import { cn } from '@/lib/utils';
import type { LeadSuggestion } from '../api';

export interface LeadsEmptyProps {
  type: 'no-data' | 'no-results' | 'error';
  searchQuery?: string;
  hasActiveFilters?: boolean;
  errorMessage?: string;
  onAddLead?: () => void;
  onClearSearch?: () => void;
  onClearFilters?: () => void;
  onSelectSuggestion?: (suggestion: LeadSuggestion) => void;
  onRetry?: () => void;
  className?: string;
}

export function LeadsEmpty({
  type,
  searchQuery = '',
  hasActiveFilters = false,
  errorMessage,
  onAddLead,
  onClearSearch,
  onClearFilters,
  onSelectSuggestion,
  onRetry,
  className,
}: LeadsEmptyProps) {
  const t = useTranslations('leads');
  const tCommon = useTranslations('common');

  // Fuzzy suggestions when zero results and query >= 3 chars
  const { data: suggestions = [] } = useSuggest(
    searchQuery,
    type === 'no-results' && Boolean(searchQuery.trim().length >= 3)
  );

  // 1. Error state
  if (type === 'error') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-destructive/20 bg-destructive/5 my-6',
          className
        )}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
          <AlertCircle className="size-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          {errorMessage || 'حدث خطأ أثناء تحميل البيانات'}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-5">
          يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
            <RotateCcw className="size-3.5" />
            <span>{tCommon('retry')}</span>
          </Button>
        )}
      </div>
    );
  }

  // 2. Empty No Data (0 leads in entire database)
  if (type === 'no-data') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-8 sm:p-16 text-center rounded-xl border border-dashed border-border bg-card my-6',
          className
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-xs">
          <Users className="size-7" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          {t('noLeads')}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {t('addFirstLead')}
        </p>
        {onAddLead && (
          <Button onClick={onAddLead} size="md" className="gap-2">
            <Plus className="size-4" />
            <span>{t('createLeadTitle')}</span>
          </Button>
        )}
      </div>
    );
  }

  // 3. Empty No Results (Search / Filter returned 0 results)
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-xl border border-border bg-card my-6 space-y-4',
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          {searchQuery ? t('noResults', { query: searchQuery }) : 'لا توجد نتائج تطابق الفلاتر المحددة'}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
          جرب البحث بكلمات مختلفة أو إزالة بعض الفلاتر لعرض نتائج أكثر.
        </p>
      </div>

      {/* Fuzzy Suggestions: "Did you mean…?" */}
      {suggestions.length > 0 && (
        <div className="p-3 rounded-lg bg-muted border border-border max-w-md w-full text-start">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-2">
            <Sparkles className="size-3.5" />
            <span>{t('didYouMean')}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((sug) => (
              <button
                key={sug.id}
                type="button"
                onClick={() => onSelectSuggestion?.(sug)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-card text-foreground border border-border hover:border-primary hover:text-primary transition-colors"
              >
                <span>{sug.name}</span>
                {sug.instagram_handle && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    (@{sug.instagram_handle})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2">
        {searchQuery && onClearSearch && (
          <Button variant="outline" size="sm" onClick={onClearSearch} className="gap-1.5">
            <RotateCcw className="size-3.5" />
            <span>{t('clearSearch')}</span>
          </Button>
        )}

        {hasActiveFilters && onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters} className="gap-1.5">
            <span>{t('clearAllFilters')}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
