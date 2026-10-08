'use client';

import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      dir="rtl"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-[var(--surface)] group-[.toaster]:text-[var(--fg)] group-[.toaster]:border-[var(--border)] group-[.toaster]:shadow-[var(--shadow-md)] group-[.toaster]:rounded-[var(--radius-md)]',
          description: 'group-[.toast]:text-[var(--fg-muted)]',
          actionButton:
            'group-[.toast]:bg-[var(--primary)] group-[.toast]:text-[var(--primary-fg)] font-medium',
          cancelButton:
            'group-[.toast]:bg-[var(--surface-2)] group-[.toast]:text-[var(--fg)]',
        },
      }}
      {...props}
    />
  );
}
