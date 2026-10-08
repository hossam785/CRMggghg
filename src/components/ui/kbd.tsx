import * as React from 'react';
import { cn } from '@/lib/utils';

export type KbdProps = React.HTMLAttributes<HTMLElement>;

export function Kbd({ className, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-1.5 font-mono text-[10px] font-medium text-[var(--fg-muted)]',
        className
      )}
      {...props}
    />
  );
}
