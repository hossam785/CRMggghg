'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { X, RotateCcw } from 'lucide-react';
import { useIndustries, useCountries } from '../queries';
import { getCountryFlag } from './fields/CountryCombobox';
import { cn } from '@/lib/utils';
import type { LeadFilters } from '../schema';
import type { LeadStage } from '@/types/database';

export interface ActiveFilterChipsProps {
  filters: LeadFilters;
  onRemoveFilter: (patch: Partial<LeadFilters>) => void;
  onClearAll: () => void;
  className?: string;
}

export function ActiveFilterChips({
  filters,
  onRemoveFilter,
  onClearAll,
  className,
}: ActiveFilterChipsProps) {
  const t = useTranslations('leads');
  const tStages = useTranslations('stages');
  const locale = useLocale();

  const { data: industries = [] } = useIndustries();
  const { data: countries = [] } = useCountries();

  // Collect active chips
  const chips: Array<{
    id: string;
    label: string;
    onRemove: () => void;
  }> = [];

  // 1. Stages (if filtered)
  if (filters.stages && filters.stages.length > 0) {
    for (const stage of filters.stages) {
      chips.push({
        id: `stage-${stage}`,
        label: tStages(stage as LeadStage),
        onRemove: () => {
          const next = filters.stages?.filter((s) => s !== stage) || [];
          onRemoveFilter({ stages: next.length > 0 ? next : undefined });
        },
      });
    }
  }

  // 2. Industries
  if (filters.industries && filters.industries.length > 0) {
    for (const indId of filters.industries) {
      const match = industries.find((i) => i.id === indId);
      const name = match ? (locale === 'ar' ? match.label_ar : match.label_en) : `#${indId}`;
      chips.push({
        id: `industry-${indId}`,
        label: `${t('industry')}: ${name}`,
        onRemove: () => {
          const next = filters.industries?.filter((id) => id !== indId) || [];
          onRemoveFilter({ industries: next.length > 0 ? next : undefined });
        },
      });
    }
  }

  // 3. Countries
  if (filters.countries && filters.countries.length > 0) {
    for (const code of filters.countries) {
      const match = countries.find((c) => c.code === code);
      const name = match ? (locale === 'ar' ? match.name_ar : match.name_en) : code;
      const flag = getCountryFlag(code);
      chips.push({
        id: `country-${code}`,
        label: `${flag} ${name}`,
        onRemove: () => {
          const next = filters.countries?.filter((c) => c !== code) || [];
          onRemoveFilter({ countries: next.length > 0 ? next : undefined });
        },
      });
    }
  }

  // 4. Follow-up Due
  if (filters.due) {
    chips.push({
      id: 'due',
      label: t('filterDue'),
      onRemove: () => onRemoveFilter({ due: undefined }),
    });
  }

  // 5. WhatsApp
  if (filters.has_whatsapp) {
    chips.push({
      id: 'has_whatsapp',
      label: t('filterHasWhatsapp'),
      onRemove: () => onRemoveFilter({ has_whatsapp: undefined }),
    });
  }

  // 6. Has Content
  if (filters.has_content !== undefined) {
    chips.push({
      id: 'has_content',
      label: `${t('hasContent')}: ${filters.has_content ? 'نعم' : 'لا'}`,
      onRemove: () => onRemoveFilter({ has_content: undefined }),
    });
  }

  // 7. Appears in Content
  if (filters.appears_in_content !== undefined) {
    chips.push({
      id: 'appears_in_content',
      label: `${t('appearsInContent')}: ${filters.appears_in_content ? 'نعم' : 'لا'}`,
      onRemove: () => onRemoveFilter({ appears_in_content: undefined }),
    });
  }

  // 8. Has Videographer
  if (filters.has_videographer && filters.has_videographer !== 'unknown') {
    chips.push({
      id: 'has_videographer',
      label: `${t('hasVideographer')}: ${filters.has_videographer === 'yes' ? 'نعم' : 'لا'}`,
      onRemove: () => onRemoveFilter({ has_videographer: undefined }),
    });
  }

  // 9. Missing Data
  if (filters.missing) {
    const missingArr = Array.isArray(filters.missing)
      ? filters.missing
      : [filters.missing];
    for (const m of missingArr) {
      const label =
        m === 'any'
          ? t('filterMissingAny')
          : m === 'industry'
            ? t('filterMissingIndustry')
            : m === 'country'
              ? t('filterMissingCountry')
              : m === 'job_title'
                ? t('filterMissingJobTitle')
                : m === 'qualification'
                  ? t('filterMissingQualification')
                  : m;
      chips.push({
        id: `missing-${m}`,
        label: `${t('filterMissing')}: ${label}`,
        onRemove: () => {
          const next = missingArr.filter((item) => item !== m);
          onRemoveFilter({ missing: next.length > 0 ? next : undefined });
        },
      });
    }
  }

  // 10. Date Range
  if (filters.created_from || filters.created_to) {
    const rangeLabel =
      filters.created_from && filters.created_to
        ? `${filters.created_from} → ${filters.created_to}`
        : filters.created_from
          ? `${t('from')} ${filters.created_from}`
          : `${t('to')} ${filters.created_to}`;

    chips.push({
      id: 'created_date',
      label: rangeLabel,
      onRemove: () => onRemoveFilter({ created_from: undefined, created_to: undefined }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5 py-1', className)}>
      <span className="text-xs text-muted-foreground me-1 select-none">
        {t('activeFilters')}:
      </span>

      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border shadow-2xs"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove filter ${chip.label}`}
            className="p-0.5 rounded-full hover:bg-card text-muted-foreground hover:text-destructive focus:outline-none transition-colors"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-destructive hover:underline focus:outline-none transition-colors select-none"
      >
        <RotateCcw className="size-3" />
        <span>{t('clearAllFilters')}</span>
      </button>
    </div>
  );
}
