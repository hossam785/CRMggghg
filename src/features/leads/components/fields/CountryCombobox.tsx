'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useCountries } from '@/features/leads/queries';
import { normalizeSearch } from '@/lib/normalize/arabic';
import { cn } from '@/lib/utils';
import type { Country } from '@/features/leads/api';

const RECENT_COUNTRIES_STORAGE_KEY = 'scope_recent_countries';
const MAX_RECENT_COUNTRIES = 5;

/**
 * Derives country flag emoji from 2-letter ISO country code.
 */
export function getCountryFlag(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export interface CountryComboboxProps {
  id?: string;
  value: string | null | undefined;
  onChange: (countryCode: string | null) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

function getStoredRecentCodes(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_COUNTRIES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, MAX_RECENT_COUNTRIES);
      }
    }
  } catch {
    // Ignore localStorage errors (private browsing, quotas)
  }
  return [];
}

export function CountryCombobox({
  id = 'country-combobox',
  value,
  onChange,
  error,
  disabled,
  className,
}: CountryComboboxProps) {
  const t = useTranslations('leads');
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [recentCodes, setRecentCodes] = React.useState<string[]>(getStoredRecentCodes);

  const { data: countries = [], isLoading } = useCountries();

  const saveRecentCountry = (code: string) => {
    try {
      const updated = [code, ...recentCodes.filter((c) => c !== code)].slice(
        0,
        MAX_RECENT_COUNTRIES
      );
      setRecentCodes(updated);
      localStorage.setItem(RECENT_COUNTRIES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const selectedCountry = React.useMemo(() => {
    if (!value) return null;
    return countries.find((c) => c.code === value.toUpperCase()) || null;
  }, [countries, value]);

  const handleSelectCountry = (country: Country) => {
    onChange(country.code);
    saveRecentCountry(country.code);
    setOpen(false);
    setSearchQuery('');
  };

  // Filter countries using bilingual search with normalizeSearch
  const filteredCountries = React.useMemo(() => {
    const q = normalizeSearch(searchQuery.trim());
    if (!q) return countries;

    return countries.filter((c) => {
      const arMatch = normalizeSearch(c.name_ar).includes(q);
      const enMatch = normalizeSearch(c.name_en).includes(q);
      const codeMatch = c.code.toLowerCase().includes(q);
      return arMatch || enMatch || codeMatch;
    });
  }, [countries, searchQuery]);

  const recentCountryList = React.useMemo(() => {
    if (searchQuery.trim() || recentCodes.length === 0) return [];
    return recentCodes
      .map((code) => countries.find((c) => c.code === code))
      .filter((c): c is Country => Boolean(c));
  }, [countries, recentCodes, searchQuery]);

  const getCountryName = (c: Country) => (locale === 'en' ? c.name_en : c.name_ar);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-sm font-medium text-[var(--color-fg-primary)]">
        {t('country')}
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || isLoading}
            className={cn(
              'w-full justify-between font-normal text-start h-10 px-3',
              error ? 'border-[var(--color-error)] focus-visible:ring-[var(--color-error)]' : '',
              !selectedCountry && 'text-[var(--color-fg-muted)]'
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
          >
            {selectedCountry ? (
              <span className="flex items-center gap-2 truncate">
                <span className="text-base shrink-0 leading-none" aria-hidden="true">
                  {getCountryFlag(selectedCountry.code)}
                </span>
                <span className="truncate">{getCountryName(selectedCountry)}</span>
                <span className="text-xs text-[var(--color-fg-muted)] font-mono shrink-0 ms-1">
                  ({selectedCountry.code})
                </span>
              </span>
            ) : (
              <span>{isLoading ? '...' : t('selectCountry')}</span>
            )}
            <ChevronsUpDown className="ms-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t('searchCountry')}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>{t('selectCountry')}</CommandEmpty>

              {/* Top 5 Recent Countries */}
              {recentCountryList.length > 0 && (
                <CommandGroup heading={t('recentCountries')}>
                  {recentCountryList.map((country) => (
                    <CommandItem
                      key={`recent-${country.code}`}
                      value={country.code}
                      onSelect={() => handleSelectCountry(country)}
                      className="flex items-center justify-between cursor-pointer py-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base shrink-0" aria-hidden="true">
                          {getCountryFlag(country.code)}
                        </span>
                        <span className="truncate">{getCountryName(country)}</span>
                      </div>
                      {selectedCountry?.code === country.code && (
                        <Check className="size-4 shrink-0 text-[var(--color-accent)]" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* All / Filtered Countries */}
              <CommandGroup heading={recentCountryList.length > 0 ? t('allCountries') : undefined}>
                {filteredCountries.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={country.code}
                    onSelect={() => handleSelectCountry(country)}
                    className="flex items-center justify-between cursor-pointer py-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base shrink-0" aria-hidden="true">
                        {getCountryFlag(country.code)}
                      </span>
                      <span className="truncate">{getCountryName(country)}</span>
                      <span className="text-xs text-[var(--color-fg-muted)] font-mono shrink-0 ms-1">
                        ({country.code})
                      </span>
                    </div>
                    {selectedCountry?.code === country.code && (
                      <Check className="size-4 shrink-0 text-[var(--color-accent)]" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-[var(--color-error)] font-medium mt-0.5 animate-in fade-in-50"
        >
          {error}
        </p>
      )}
    </div>
  );
}
