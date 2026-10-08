'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StageBadge } from '@/components/ui/stage-badge';
import { parseInstagram, instagramUrl } from '@/lib/normalize/instagram';
import { useDuplicateCheck } from '@/features/leads/queries';
import { cn } from '@/lib/utils';

export interface InstagramFieldProps {
  id?: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  error?: string;
  onDuplicateChange?: (isDuplicate: boolean) => void;
  excludeLeadId?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}

export function InstagramField({
  id = 'instagram-field',
  value,
  onChange,
  onBlur,
  error,
  onDuplicateChange,
  excludeLeadId,
  autoFocus,
  disabled,
  className,
}: InstagramFieldProps) {
  const t = useTranslations('leads');
  const [inputValue, setInputValue] = React.useState(value || '');
  const [prevValue, setPrevValue] = React.useState(value);
  const [internalError, setInternalError] = React.useState<string | null>(null);

  // Synchronize internal draft when prop changes externally (e.g. form reset)
  if (value !== prevValue) {
    setPrevValue(value);
    setInputValue(value || '');
  }

  const currentHandle = value || null;

  // Real-time duplicate check (debounced 300ms)
  const { data: duplicates } = useDuplicateCheck({
    handle: currentHandle,
    excludeId: excludeLeadId,
  });

  const duplicate = duplicates && duplicates.length > 0 ? duplicates[0] : null;
  const isDuplicate = Boolean(duplicate);

  React.useEffect(() => {
    onDuplicateChange?.(isDuplicate);
  }, [isDuplicate, onDuplicateChange]);

  const handleNormalize = (text: string) => {
    const raw = text.trim();
    if (!raw) {
      setInternalError(null);
      setInputValue('');
      onChange(null);
      return;
    }

    const res = parseInstagram(raw);
    if (res.ok) {
      setInternalError(null);
      setInputValue(res.handle);
      onChange(res.handle);
    } else {
      if (res.reason === 'post_link') {
        setInternalError(t('postLinkError'));
      } else if (res.reason === 'invalid') {
        setInternalError(t('invalidHandleError'));
      }
      // Still update raw text so user can correct it
      setInputValue(raw);
      onChange(null);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted) {
      e.preventDefault();
      handleNormalize(pasted);
    }
  };

  const handleInputBlur = () => {
    handleNormalize(inputValue);
    onBlur?.();
  };

  const displayError = error || internalError;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-sm font-medium text-[var(--color-fg-primary)]">
        {t('instagram')}
      </Label>

      <div className="relative">
        <Input
          id={id}
          type="text"
          autoFocus={autoFocus}
          disabled={disabled}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPaste={handlePaste}
          onBlur={handleInputBlur}
          placeholder="ahmed.re / @handle / instagram.com/..."
          dir="ltr"
          className={cn(
            'text-start text-base sm:text-sm font-mono',
            displayError
              ? 'border-[var(--color-error)] focus-visible:ring-[var(--color-error)]'
              : isDuplicate
                ? 'border-[var(--color-warning)] focus-visible:ring-[var(--color-warning)]'
                : ''
          )}
          aria-invalid={Boolean(displayError || isDuplicate)}
          aria-describedby={
            displayError ? `${id}-error` : isDuplicate ? `${id}-duplicate` : undefined
          }
        />
      </div>

      {/* Valid Instagram Handle Chip */}
      {currentHandle && !displayError && (
        <div className="flex items-center gap-2 mt-0.5">
          <a
            href={instagramUrl(currentHandle)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius-full)] text-xs font-mono bg-[var(--color-bg-secondary)] text-[var(--color-accent)] hover:underline border border-[var(--color-border-subtle)] transition-colors"
          >
            <bdi dir="ltr">@{currentHandle}</bdi>
            <ExternalLink className="size-3 shrink-0 ms-0.5" aria-hidden="true" />
          </a>
        </div>
      )}

      {/* Duplicate Warning Alert */}
      {duplicate && !displayError && (
        <div
          id={`${id}-duplicate`}
          role="alert"
          className="flex items-center gap-2 p-2 rounded-[var(--radius-md)] bg-[var(--color-warning-subtle)] border border-[var(--color-warning)] text-xs text-[var(--color-warning-fg)] mt-1 animate-in fade-in-50 duration-200"
        >
          <AlertTriangle className="size-4 shrink-0 text-[var(--color-warning)]" />
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            <span>{t('duplicateWarning')}</span>
            <span className="font-semibold">{duplicate.name}</span>
            <StageBadge stage={duplicate.stage} size="sm" />
            <Link
              href={`/leads/${duplicate.id}`}
              className="font-medium underline ms-auto hover:text-[var(--color-fg-primary)]"
            >
              {t('openLead')} ↗
            </Link>
          </div>
        </div>
      )}

      {/* Error Message */}
      {displayError && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-[var(--color-error)] font-medium mt-0.5 animate-in fade-in-50"
        >
          {displayError}
        </p>
      )}
    </div>
  );
}
