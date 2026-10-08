import * as React from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface SaveIndicatorProps {
  state: SaveState;
  onRetry?: () => void;
  className?: string;
}

export function SaveIndicator({ state, onRetry, className }: SaveIndicatorProps) {
  if (state === 'idle') return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium transition-all duration-[var(--dur-fast)]',
        state === 'saving' && 'text-[var(--fg-muted)]',
        state === 'saved' &&
          'text-[oklch(0.32_0.14_150)] dark:text-[oklch(0.90_0.06_150)]',
        state === 'error' && 'text-[var(--danger)]',
        className
      )}
      aria-live="polite"
    >
      {state === 'saving' && (
        <>
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          <span>جارِ الحفظ…</span>
        </>
      )}

      {state === 'saved' && (
        <>
          <Check className="size-3.5 stroke-[2.5]" aria-hidden="true" />
          <span>محفوظ</span>
        </>
      )}

      {state === 'error' && (
        <>
          <AlertCircle className="size-3.5" aria-hidden="true" />
          <span>فشل الحفظ</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ms-1 underline hover:opacity-80 focus:outline-none"
            >
              إعادة المحاولة
            </button>
          )}
        </>
      )}
    </div>
  );
}
