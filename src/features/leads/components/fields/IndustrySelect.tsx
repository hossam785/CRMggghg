'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIndustries } from '@/features/leads/queries';
import { cn } from '@/lib/utils';

export interface IndustrySelectProps {
  id?: string;
  industryId: number | null | undefined;
  industryOther: string | null | undefined;
  onIndustryChange: (id: number | null) => void;
  onOtherChange: (other: string | null) => void;
  industryError?: string;
  otherError?: string;
  disabled?: boolean;
  className?: string;
}

export function IndustrySelect({
  id = 'industry-select',
  industryId,
  industryOther,
  onIndustryChange,
  onOtherChange,
  industryError,
  otherError,
  disabled,
  className,
}: IndustrySelectProps) {
  const t = useTranslations('leads');
  const locale = useLocale();
  const { data: industries = [], isLoading } = useIndustries();

  const selectedIndustry = React.useMemo(() => {
    if (!industryId) return null;
    return industries.find((ind) => ind.id === industryId) || null;
  }, [industries, industryId]);

  const isOtherSelected = Boolean(selectedIndustry?.is_other);

  const handleValueChange = (val: string) => {
    if (!val || val === 'none') {
      onIndustryChange(null);
      onOtherChange(null);
      return;
    }
    const numId = Number(val);
    onIndustryChange(numId);

    const ind = industries.find((i) => i.id === numId);
    if (!ind?.is_other) {
      onOtherChange(null);
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id} className="text-sm font-medium text-[var(--color-fg-primary)]">
          {t('industry')}
        </Label>

        <Select
          disabled={disabled || isLoading}
          value={industryId ? String(industryId) : ''}
          onValueChange={handleValueChange}
        >
          <SelectTrigger
            id={id}
            className={cn(
              industryError ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]' : ''
            )}
            aria-invalid={Boolean(industryError)}
            aria-describedby={industryError ? `${id}-error` : undefined}
          >
            <SelectValue placeholder={isLoading ? '...' : t('selectIndustry')} />
          </SelectTrigger>
          <SelectContent>
            {industries.map((ind) => (
              <SelectItem key={ind.id} value={String(ind.id)}>
                {locale === 'en' ? ind.label_en : ind.label_ar}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {industryError && (
          <p
            id={`${id}-error`}
            role="alert"
            className="text-xs text-[var(--color-error)] font-medium mt-0.5 animate-in fade-in-50"
          >
            {industryError}
          </p>
        )}
      </div>

      {/* If "Other" is chosen, reveal required "Specify Industry" input */}
      {isOtherSelected && (
        <div className="flex flex-col gap-1.5 ps-3 border-s-2 border-[var(--color-accent)] animate-in fade-in-50 duration-200">
          <Label
            htmlFor={`${id}-other`}
            className="text-xs font-medium text-[var(--color-fg-secondary)]"
          >
            {t('industryOther')} *
          </Label>
          <Input
            id={`${id}-other`}
            type="text"
            disabled={disabled}
            value={industryOther || ''}
            onChange={(e) => onOtherChange(e.target.value || null)}
            placeholder={t('industryOther')}
            maxLength={80}
            className={cn(
              otherError ? 'border-[var(--color-error)] focus-visible:ring-[var(--color-error)]' : ''
            )}
            aria-invalid={Boolean(otherError)}
            aria-describedby={otherError ? `${id}-other-error` : undefined}
          />
          {otherError && (
            <p
              id={`${id}-other-error`}
              role="alert"
              className="text-xs text-[var(--color-error)] font-medium mt-0.5 animate-in fade-in-50"
            >
              {otherError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
