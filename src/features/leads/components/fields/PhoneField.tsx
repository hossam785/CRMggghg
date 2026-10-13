'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parsePhone, waUrl } from '@/lib/normalize/phone';
import { cn } from '@/lib/utils';

export interface PhoneFieldProps {
  id?: string;
  value: string | null | undefined;
  onChange: (e164: string | null) => void;
  onBlur?: () => void;
  error?: string;
  countryCode?: string | null;
  countryName?: string;
  disabled?: boolean;
  className?: string;
}

export function PhoneField({
  id = 'phone-field',
  value,
  onChange,
  onBlur,
  error,
  countryCode = 'EG',
  countryName,
  disabled,
  className,
}: PhoneFieldProps) {
  const t = useTranslations('leads');
  const [rawInput, setRawInput] = React.useState(value || '');
  const [prevValue, setPrevValue] = React.useState(value);
  const [internalError, setInternalError] = React.useState<string | null>(null);

  const activeRegion = (countryCode?.toUpperCase().slice(0, 2) || 'EG') as CountryCode;
  const [prevRegion, setPrevRegion] = React.useState(activeRegion);

  // Sync internal rawInput when value prop changes externally (e.g. form reset)
  if (value !== prevValue) {
    setPrevValue(value);
    setRawInput(value || '');
    setInternalError(null);
  }

  // When activeRegion changes, re-validate current rawInput during render
  if (activeRegion !== prevRegion) {
    setPrevRegion(activeRegion);
    const trimmed = rawInput.trim();
    if (trimmed) {
      const res = parsePhone(trimmed, activeRegion);
      if (res.ok) {
        onChange(res.e164);
        setInternalError(null);
      } else {
        onChange(null);
        setInternalError(
          t('invalidPhoneError', { country: countryName || activeRegion })
        );
      }
    }
  }

  // Derive international formatted preview from value
  const formattedPreview = React.useMemo(() => {
    if (!value) return null;
    const parsed = parsePhoneNumberFromString(value);
    return parsed?.isValid() ? parsed.formatInternational() : value;
  }, [value]);

  const validateAndNotify = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) {
      setInternalError(null);
      onChange(null);
      return;
    }

    const res = parsePhone(trimmed, activeRegion);
    if (res.ok) {
      setInternalError(null);
      onChange(res.e164);
    } else {
      setInternalError(
        t('invalidPhoneError', { country: countryName || activeRegion })
      );
      onChange(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRawInput(val);
    validateAndNotify(val);
  };

  const handleInputBlur = () => {
    validateAndNotify(rawInput);
    onBlur?.();
  };

  const displayError = error || internalError;
  const currentE164 = value || null;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {t('whatsapp')}
      </Label>

      <div className="relative">
        <Input
          id={id}
          type="tel"
          disabled={disabled}
          value={rawInput}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="010 1234 5678 / +20..."
          dir="ltr"
          className={cn(
            'text-start text-base sm:text-sm font-mono',
            displayError ? 'border-destructive focus-visible:ring-destructive' : ''
          )}
          aria-invalid={Boolean(displayError)}
          aria-describedby={displayError ? `${id}-error` : undefined}
        />
      </div>

      {/* Valid Phone & WhatsApp Chat Chip */}
      {currentE164 && !displayError && (
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          {formattedPreview && (
            <span className="text-xs text-muted-foreground font-mono">
              <bdi dir="ltr">{formattedPreview}</bdi>
            </span>
          )}
          <a
            href={waUrl(currentE164)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 hover:underline border border-emerald-500/20 transition-colors"
          >
            <MessageCircle className="size-3 shrink-0" aria-hidden="true" />
            <span>WhatsApp ↗</span>
            <ExternalLink className="size-2.5 shrink-0 ms-0.5" aria-hidden="true" />
          </a>
        </div>
      )}

      {/* Error Message */}
      {displayError && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-destructive font-medium mt-0.5 animate-in fade-in-50"
        >
          {displayError}
        </p>
      )}
    </div>
  );
}
