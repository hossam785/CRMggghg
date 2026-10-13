'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Moon, Globe, Clock, Check, ChevronsUpDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
import { CountryCombobox } from '@/features/leads/components/fields/CountryCombobox';
import { SaveIndicator, type SaveState } from '@/components/ui/save-indicator';
import { useSettings, useUpdateSettings } from '../queries';
import { useSetLocale } from '@/hooks/use-set-locale';
import { cn } from '@/lib/utils';

export function GeneralSettingsCard() {
  const t = useTranslations('settings');
  const currentLocale = useLocale();
  const { setLocale, isPending: isLocalePending } = useSetLocale();
  const { data: settings } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [tzSaveState, setTzSaveState] = React.useState<SaveState>('idle');
  const [countrySaveState, setCountrySaveState] = React.useState<SaveState>('idle');
  const [tzOpen, setTzOpen] = React.useState(false);
  const [tzSearch, setTzSearch] = React.useState('');

  const handleLanguageChange = (nextLocale: 'ar' | 'en') => {
    if (nextLocale === currentLocale) return;
    setLocale(nextLocale);
    updateSettingsMutation.mutate({ locale: nextLocale });
  };

  const handleTimezoneChange = async (tz: string) => {
    setTzOpen(false);
    setTzSaveState('saving');
    updateSettingsMutation.mutate(
      { timezone: tz },
      {
        onSuccess: () => {
          setTzSaveState('saved');
          setTimeout(() => setTzSaveState('idle'), 2000);
        },
        onError: () => {
          setTzSaveState('error');
        },
      }
    );
  };

  const handleDefaultCountryChange = (countryCode: string | null) => {
    setCountrySaveState('saving');
    updateSettingsMutation.mutate(
      { default_country: countryCode },
      {
        onSuccess: () => {
          setCountrySaveState('saved');
          setTimeout(() => setCountrySaveState('idle'), 2000);
        },
        onError: () => {
          setCountrySaveState('error');
        },
      }
    );
  };

  const timezones = React.useMemo(() => {
    try {
      if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
        return Intl.supportedValuesOf('timeZone');
      }
    } catch {}
    return [
      'Africa/Cairo',
      'Asia/Riyadh',
      'Asia/Dubai',
      'Asia/Kuwait',
      'Asia/Qatar',
      'Asia/Bahrain',
      'Asia/Amman',
      'Asia/Beirut',
      'Africa/Casablanca',
      'UTC',
      'Europe/London',
      'Europe/Paris',
      'America/New_York',
    ];
  }, []);

  const filteredTimezones = React.useMemo(() => {
    if (!tzSearch.trim()) return timezones.slice(0, 50);
    const q = tzSearch.toLowerCase();
    return timezones.filter((tz) => tz.toLowerCase().includes(q)).slice(0, 50);
  }, [timezones, tzSearch]);

  const selectedTimezone = settings?.timezone || 'Africa/Cairo';

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
      <div className="border-b border-border/60 pb-4">
        <h2 className="text-lg font-bold text-foreground">{t('general')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('generalDesc')}</p>
      </div>

      <div className="space-y-6">
        {/* Language Selection */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Globe className="size-4 text-primary" />
              {t('language')}
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">{t('languageDesc')}</p>
          </div>
          <div className="inline-flex rounded-lg border border-border p-1 bg-muted/40">
            <button
              type="button"
              disabled={isLocalePending}
              onClick={() => handleLanguageChange('ar')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
                currentLocale === 'ar'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t('langAr')}
            </button>
            <button
              type="button"
              disabled={isLocalePending}
              onClick={() => handleLanguageChange('en')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
                currentLocale === 'en'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t('langEn')}
            </button>
          </div>
        </div>

        {/* Theme Status (Locked Dark Mode) */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border/40 pt-4">
          <div>
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Moon className="size-4 text-primary" />
              {t('theme')}
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              تم تثبيت الوضع الداكن (Dark Obsidian) كمعيار قياسي فائق الأناقة لكافة شاشات المنظومة
            </p>
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/25 shadow-xs">
              <Moon className="size-3.5 fill-primary/20" />
              <span>الوضع الداكن · مفعّل دائماً</span>
            </span>
          </div>
        </div>

        {/* Timezone Selection */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border/40 pt-4">
          <div className="max-w-md">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                {t('timezone')}
              </Label>
              <SaveIndicator state={tzSaveState} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{t('timezoneDesc')}</p>
          </div>

          <Popover open={tzOpen} onOpenChange={setTzOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={tzOpen}
                className="w-full sm:w-[260px] justify-between text-xs font-mono font-normal"
              >
                <span className="truncate">{selectedTimezone}</span>
                <ChevronsUpDown className="ms-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="end">
              <Command>
                <CommandInput
                  placeholder={t('searchTimezone')}
                  value={tzSearch}
                  onValueChange={setTzSearch}
                  className="text-xs"
                />
                <CommandList>
                  <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                    لا توجد نتائج
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredTimezones.map((tz) => (
                      <CommandItem
                        key={tz}
                        value={tz}
                        onSelect={() => handleTimezoneChange(tz)}
                        className="text-xs font-mono flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">{tz}</span>
                        {selectedTimezone === tz && (
                          <Check className="size-3.5 text-primary" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Default Country Selection */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border/40 pt-4">
          <div className="max-w-md">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold text-foreground">
                {t('defaultCountry')}
              </Label>
              <SaveIndicator state={countrySaveState} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('defaultCountryDesc')}
            </p>
          </div>

          <div className="w-full sm:w-[260px]">
            <CountryCombobox
              value={settings?.default_country || 'EG'}
              onChange={handleDefaultCountryChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
