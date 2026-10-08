import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-[var(--radius-md)] border bg-[var(--surface)] px-3 py-2 text-base text-[var(--fg)] placeholder:text-[var(--fg-muted)] transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          invalid
            ? 'border-[var(--danger)] focus-visible:ring-[var(--danger)]'
            : 'border-[var(--border)] focus-visible:border-[var(--primary)] focus-visible:ring-[var(--focus)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        aria-invalid={invalid ? 'true' : undefined}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
