'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  SlidersHorizontal,
  RotateCcw,
  Search,
  Check,
  X,
  Calendar,
  Briefcase,
  Globe,
  Sparkles,
  PhoneCall,
  AlertCircle,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useIndustries, useCountries, useStageCounts } from '../queries';
import { getCountryFlag } from './fields/CountryCombobox';
import { normalizeSearch } from '@/lib/normalize/arabic';
import { cn } from '@/lib/utils';
import type { LeadFilters } from '../schema';
import type { TriState } from '@/types/database';

export interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: LeadFilters;
  onApplyFilters: (newFilters: Partial<LeadFilters>) => void;
  onResetFilters: () => void;
}

const MISSING_FIELD_OPTIONS = [
  { id: 'any', labelKey: 'filterMissingAny' },
  { id: 'industry', labelKey: 'filterMissingIndustry' },
  { id: 'country', labelKey: 'filterMissingCountry' },
  { id: 'job_title', labelKey: 'filterMissingJobTitle' },
  { id: 'qualification', labelKey: 'filterMissingQualification' },
] as const;

export function FilterSheet({
  open,
  onOpenChange,
  filters,
  onApplyFilters,
  onResetFilters,
}: FilterSheetProps) {
  const t = useTranslations('leads');
  const locale = useLocale();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Local draft for mobile
  const [draft, setDraft] = React.useState<LeadFilters>(filters);
  const [countrySearch, setCountrySearch] = React.useState('');

  // Sync draft when opened (React 19 pattern)
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDraft(filters);
      setCountrySearch('');
    }
  }

  // Data references
  const { data: industries = [] } = useIndustries();
  const { data: countries = [] } = useCountries();

  // Active state to work with (direct on desktop, draft on mobile)
  const activeState = isDesktop ? filters : draft;

  // Change handler
  const handleUpdate = React.useCallback(
    (patch: Partial<LeadFilters>) => {
      if (isDesktop) {
        onApplyFilters(patch);
      } else {
        setDraft((prev) => ({ ...prev, ...patch }));
      }
    },
    [isDesktop, onApplyFilters]
  );

  // Live count for mobile apply button
  const { data: mobileStageCounts } = useStageCounts(draft);
  const mobileResultCount = React.useMemo(() => {
    if (!mobileStageCounts) return 0;
    return mobileStageCounts.reduce((acc, curr) => acc + (curr.total || 0), 0);
  }, [mobileStageCounts]);

  const numberFormatter = React.useMemo(() => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US');
  }, [locale]);

  // Filtered countries
  const filteredCountries = React.useMemo(() => {
    if (!countrySearch.trim()) return countries.slice(0, 30);
    const normalized = normalizeSearch(countrySearch.trim());
    return countries
      .filter((c) => {
        const ar = normalizeSearch(c.name_ar || '');
        const en = (c.name_en || '').toLowerCase();
        const code = (c.code || '').toLowerCase();
        return ar.includes(normalized) || en.includes(normalized) || code.includes(normalized);
      })
      .slice(0, 30);
  }, [countries, countrySearch]);

  // Quick Date helpers
  const handleQuickDate = (type: 'today' | '7days' | 'month' | 'all') => {
    const today = new Date().toISOString().slice(0, 10);
    if (type === 'all') {
      handleUpdate({ created_from: undefined, created_to: undefined });
    } else if (type === 'today') {
      handleUpdate({ created_from: today, created_to: today });
    } else if (type === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      handleUpdate({ created_from: past.toISOString().slice(0, 10), created_to: today });
    } else if (type === 'month') {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      handleUpdate({ created_from: monthStart, created_to: today });
    }
  };

  const handleMobileApply = () => {
    onApplyFilters(draft);
    onOpenChange(false);
  };

  const handleReset = () => {
    onResetFilters();
    if (!isDesktop) {
      setDraft({});
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? 'end' : 'bottom'}
        className={cn(
          'flex flex-col p-0 gap-0 overflow-hidden',
          isDesktop ? 'w-full sm:max-w-md' : 'max-h-[88vh]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 shrink-0">
          <SheetHeader className="text-start space-y-0.5">
            <SheetTitle className="flex items-center gap-2 text-base font-semibold text-[var(--fg)]">
              <SlidersHorizontal className="size-4 text-[var(--primary)] shrink-0" />
              <span>{t('filtersTitle')}</span>
            </SheetTitle>
            <SheetDescription className="text-xs text-[var(--fg-muted)]">
              {t('activeFilters')}
            </SheetDescription>
          </SheetHeader>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-[var(--fg-muted)] hover:text-[var(--danger)] h-8 px-2 gap-1"
          >
            <RotateCcw className="size-3.5" />
            <span>{t('resetFilters')}</span>
          </Button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* 1. Industries */}
          <div className="space-y-2.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--fg)]">
              <Briefcase className="size-3.5 text-[var(--fg-muted)]" />
              <span>{t('industry')}</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {industries.map((ind) => {
                const isSelected = activeState.industries?.includes(ind.id);
                const label = locale === 'ar' ? ind.label_ar : ind.label_en;
                return (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => {
                      const cur = activeState.industries || [];
                      const next = isSelected
                        ? cur.filter((id) => id !== ind.id)
                        : [...cur, ind.id];
                      handleUpdate({ industries: next.length > 0 ? next : undefined });
                    }}
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                      isSelected
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--surface-2)] text-[var(--fg-muted)] border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--fg)]'
                    )}
                  >
                    {isSelected && <Check className="size-3" />}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Countries */}
          <div className="space-y-2.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--fg)]">
              <Globe className="size-3.5 text-[var(--fg-muted)]" />
              <span>{t('country')}</span>
            </Label>

            {/* Selected Countries Pills */}
            {activeState.countries && activeState.countries.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {activeState.countries.map((code) => {
                  const match = countries.find((c) => c.code === code);
                  const name = match ? (locale === 'ar' ? match.name_ar : match.name_en) : code;
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20"
                    >
                      <span>{getCountryFlag(code)}</span>
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = activeState.countries?.filter((c) => c !== code) || [];
                          handleUpdate({ countries: next.length > 0 ? next : undefined });
                        }}
                        className="p-0.5 hover:text-[var(--danger)]"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search Input for countries */}
            <div className="relative">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--fg-muted)] pointer-events-none" />
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder={t('searchCountry')}
                className="w-full h-8 text-xs rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] ps-8 pe-3 text-[var(--fg)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div className="max-h-36 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border)] p-1 space-y-0.5">
              {filteredCountries.map((c) => {
                const isSelected = activeState.countries?.includes(c.code);
                const name = locale === 'ar' ? c.name_ar : c.name_en;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      const cur = activeState.countries || [];
                      const next = isSelected
                        ? cur.filter((code) => code !== c.code)
                        : [...cur, c.code];
                      handleUpdate({ countries: next.length > 0 ? next : undefined });
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors text-start',
                      isSelected
                        ? 'bg-[var(--primary)]/15 text-[var(--primary)] font-medium'
                        : 'hover:bg-[var(--surface-2)] text-[var(--fg)]'
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{getCountryFlag(c.code)}</span>
                      <span>{name}</span>
                    </span>
                    {isSelected && <Check className="size-3 text-[var(--primary)]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Status & Contact (Due, WhatsApp) */}
          <div className="space-y-2.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--fg)]">
              <PhoneCall className="size-3.5 text-[var(--fg-muted)]" />
              <span>{t('statusAndContact')}</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleUpdate({ due: activeState.due ? undefined : true })}
                className={cn(
                  'flex items-center justify-between p-2.5 rounded-[var(--radius-md)] border text-xs font-medium transition-colors text-start',
                  activeState.due
                    ? 'border-[var(--warning)] bg-[var(--warning)]/10 text-[var(--warning-fg,#b45309)]'
                    : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
                )}
              >
                <span>{t('filterDue')}</span>
                {activeState.due && <Check className="size-3.5" />}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleUpdate({ has_whatsapp: activeState.has_whatsapp ? undefined : true })
                }
                className={cn(
                  'flex items-center justify-between p-2.5 rounded-[var(--radius-md)] border text-xs font-medium transition-colors text-start',
                  activeState.has_whatsapp
                    ? 'border-[var(--success)] bg-[var(--success)]/10 text-[var(--success-fg,#15803d)]'
                    : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
                )}
              >
                <span>{t('filterHasWhatsapp')}</span>
                {activeState.has_whatsapp && <Check className="size-3.5" />}
              </button>
            </div>
          </div>

          {/* 4. Qualification Toggles */}
          <div className="space-y-3">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--fg)]">
              <Sparkles className="size-3.5 text-[var(--fg-muted)]" />
              <span>{t('qualificationSection')}</span>
            </Label>

            {/* Has Content */}
            <div className="space-y-1">
              <span className="text-[11px] text-[var(--fg-muted)]">{t('hasContent')}</span>
              <div className="grid grid-cols-3 gap-1">
                {(['all', 'yes', 'no'] as const).map((opt) => {
                  const isSelected =
                    opt === 'all'
                      ? activeState.has_content === undefined
                      : opt === 'yes'
                        ? activeState.has_content === true
                        : activeState.has_content === false;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        handleUpdate({
                          has_content: opt === 'all' ? undefined : opt === 'yes',
                        })
                      }
                      className={cn(
                        'py-1 text-xs rounded font-medium border text-center transition-colors',
                        isSelected
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
                      )}
                    >
                      {opt === 'all' ? t('allTime') : opt === 'yes' ? 'نعم' : 'لا'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Appears in Content */}
            <div className="space-y-1">
              <span className="text-[11px] text-[var(--fg-muted)]">{t('appearsInContent')}</span>
              <div className="grid grid-cols-3 gap-1">
                {(['all', 'yes', 'no'] as const).map((opt) => {
                  const isSelected =
                    opt === 'all'
                      ? activeState.appears_in_content === undefined
                      : opt === 'yes'
                        ? activeState.appears_in_content === true
                        : activeState.appears_in_content === false;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        handleUpdate({
                          appears_in_content: opt === 'all' ? undefined : opt === 'yes',
                        })
                      }
                      className={cn(
                        'py-1 text-xs rounded font-medium border text-center transition-colors',
                        isSelected
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
                      )}
                    >
                      {opt === 'all' ? t('allTime') : opt === 'yes' ? 'نعم' : 'لا'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Has Videographer */}
            <div className="space-y-1">
              <span className="text-[11px] text-[var(--fg-muted)]">{t('hasVideographer')}</span>
              <div className="grid grid-cols-4 gap-1">
                {(['all', 'yes', 'no', 'unknown'] as const).map((opt) => {
                  const isSelected =
                    opt === 'all'
                      ? !activeState.has_videographer || activeState.has_videographer === 'unknown'
                      : activeState.has_videographer === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        handleUpdate({
                          has_videographer: (opt === 'all' ? undefined : opt) as TriState,
                        })
                      }
                      className={cn(
                        'py-1 text-xs rounded font-medium border text-center transition-colors',
                        isSelected
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
                      )}
                    >
                      {opt === 'all'
                        ? t('allTime')
                        : opt === 'yes'
                          ? 'نعم'
                          : opt === 'no'
                            ? 'لا'
                            : 'غير محدد'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. Missing Data */}
          <div className="space-y-2.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--fg)]">
              <AlertCircle className="size-3.5 text-[var(--fg-muted)]" />
              <span>{t('filterMissing')}</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {MISSING_FIELD_OPTIONS.map((opt) => {
                const isSelected = Array.isArray(activeState.missing)
                  ? activeState.missing.includes(opt.id)
                  : activeState.missing === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      const cur = Array.isArray(activeState.missing)
                        ? activeState.missing
                        : activeState.missing
                          ? [activeState.missing]
                          : [];
                      const next = isSelected
                        ? cur.filter((id) => id !== opt.id)
                        : [...cur, opt.id];
                      handleUpdate({ missing: next.length > 0 ? next : undefined });
                    }}
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                      isSelected
                        ? 'bg-[var(--warning)] text-amber-950 border-[var(--warning)] font-semibold'
                        : 'bg-[var(--surface-2)] text-[var(--fg-muted)] border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--fg)]'
                    )}
                  >
                    {isSelected && <Check className="size-3" />}
                    <span>{t(opt.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Created Date Range */}
          <div className="space-y-2.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--fg)]">
              <Calendar className="size-3.5 text-[var(--fg-muted)]" />
              <span>{t('createdDate')}</span>
            </Label>
            <div className="grid grid-cols-4 gap-1 mb-2">
              <button
                type="button"
                onClick={() => handleQuickDate('today')}
                className="py-1 text-xs rounded border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                {t('today')}
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('7days')}
                className="py-1 text-xs rounded border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                {t('last7Days')}
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('month')}
                className="py-1 text-xs rounded border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                {t('thisMonth')}
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('all')}
                className="py-1 text-xs rounded border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                {t('allTime')}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[11px] text-[var(--fg-muted)]">{t('from')}</span>
                <input
                  type="date"
                  value={activeState.created_from || ''}
                  onChange={(e) =>
                    handleUpdate({ created_from: e.target.value || undefined })
                  }
                  className="w-full h-8 text-xs rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 text-[var(--fg)]"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-[var(--fg-muted)]">{t('to')}</span>
                <input
                  type="date"
                  value={activeState.created_to || ''}
                  onChange={(e) =>
                    handleUpdate({ created_to: e.target.value || undefined })
                  }
                  className="w-full h-8 text-xs rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 text-[var(--fg)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer (Mobile Apply Button) */}
        {!isDesktop && (
          <SheetFooter className="border-t border-[var(--border)] p-4 bg-[var(--surface)] shrink-0 sm:flex-col">
            <Button
              type="button"
              onClick={handleMobileApply}
              className="w-full h-11 text-sm font-medium"
            >
              {t('showResults', { count: numberFormatter.format(mobileResultCount) })}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
