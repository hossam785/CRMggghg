'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isFetching?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  isFetching = false,
  className,
  autoFocus = false,
}: SearchInputProps) {
  const t = useTranslations('leads');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = React.useState(value);
  const [isFocused, setIsFocused] = React.useState(false);

  // Adjust local state during render when prop value changes (React 19 pattern)
  const [prevValue, setPrevValue] = React.useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setLocalValue(value);
  }

  // Spinner appears only if fetching takes > 300ms
  const [isLongFetching, setIsLongFetching] = React.useState(false);
  const [prevFetching, setPrevFetching] = React.useState(isFetching);
  if (isFetching !== prevFetching) {
    setPrevFetching(isFetching);
    if (!isFetching) {
      setIsLongFetching(false);
    }
  }

  React.useEffect(() => {
    if (!isFetching) return;

    const timer = setTimeout(() => {
      setIsLongFetching(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [isFetching]);

  const showSpinner = isFetching && isLongFetching;

  // Debounce sync to onChange (250ms)
  React.useEffect(() => {
    if (localValue === value) return;

    const timer = setTimeout(() => {
      onChange(localValue);
    }, 250);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange]);

  // Global keyboard shortcut '/' to focus search input
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/') return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName.toUpperCase();
      const isInput =
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        target.isContentEditable;

      if (!isInput) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  };

  return (
    <div className={cn('relative flex items-center w-full min-w-0', className)}>
      <Search
        className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground shrink-0"
        aria-hidden="true"
      />

      <input
        ref={inputRef}
        type="search"
        autoFocus={autoFocus}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={t('searchPlaceholder')}
        aria-label={t('searchPlaceholder')}
        className={cn(
          'w-full h-10 rounded-full border border-border',
          'bg-card ps-9 pe-12 text-sm text-foreground',
          'placeholder:text-muted-foreground focus:outline-none focus:border-primary',
          'focus:ring-2 focus:ring-primary/20 focus:bg-card',
          'shadow-2xs transition-all duration-150 [appearance:textfield] [&::-webkit-search-cancel-button]:hidden'
        )}
      />

      <div className="absolute end-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {showSpinner ? (
          <Loader2
            className="size-4 animate-spin text-primary shrink-0"
            aria-label="Loading"
          />
        ) : localValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            title={t('clearSearch')}
            aria-label={t('clearSearch')}
          >
            <X className="size-3.5" />
          </button>
        ) : !isFocused ? (
          <kbd
            className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded border border-border bg-muted/50 text-muted-foreground shadow-xs select-none"
            title={t('searchShortcutHint')}
          >
            /
          </kbd>
        ) : null}
      </div>
    </div>
  );
}
