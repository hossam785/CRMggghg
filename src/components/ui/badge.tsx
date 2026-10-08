import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary)] text-[var(--primary-fg)]',
        secondary: 'bg-[var(--surface-2)] text-[var(--fg)] border border-[var(--border)]',
        outline: 'border border-[var(--border)] text-[var(--fg)] bg-transparent',
        success: 'bg-[oklch(0.95_0.05_150)] text-[oklch(0.32_0.14_150)] dark:bg-[oklch(0.26_0.06_150)] dark:text-[oklch(0.90_0.06_150)]',
        warning: 'bg-[oklch(0.95_0.06_75)] text-[oklch(0.35_0.14_75)] dark:bg-[oklch(0.26_0.06_75)] dark:text-[oklch(0.90_0.07_75)]',
        danger: 'bg-[oklch(0.95_0.05_25)] text-[oklch(0.35_0.18_25)] dark:bg-[oklch(0.26_0.07_25)] dark:text-[oklch(0.90_0.07_25)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
