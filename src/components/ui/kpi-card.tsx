import * as React from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: {
    value: string | number;
    isPositive?: boolean;
    neutral?: boolean;
  };
  hint?: string;
  href?: string;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export function KpiCard({
  label,
  value,
  delta,
  hint,
  href,
  loading = false,
  error = null,
  className,
}: KpiCardProps) {
  const content = (
    <div
      className={cn(
        'group relative flex flex-col justify-between rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--primary)]/40',
        href && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--fg-muted)]">{label}</span>
        {delta && !loading && !error && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-semibold tnum',
              delta.neutral
                ? 'bg-[var(--surface-2)] text-[var(--fg-muted)]'
                : delta.isPositive
                ? 'bg-[oklch(0.95_0.05_150)] text-[oklch(0.32_0.14_150)] dark:bg-[oklch(0.26_0.06_150)] dark:text-[oklch(0.90_0.06_150)]'
                : 'bg-[oklch(0.95_0.05_25)] text-[oklch(0.35_0.18_25)] dark:bg-[oklch(0.26_0.07_25)] dark:text-[oklch(0.90_0.07_25)]'
            )}
          >
            {delta.isPositive ? (
              <ArrowUpRight className="size-3 rtl:-scale-x-100" />
            ) : delta.neutral ? null : (
              <ArrowDownLeft className="size-3 rtl:-scale-x-100" />
            )}
            <span>{delta.value}</span>
          </span>
        )}
      </div>

      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-9 w-24 rounded-[var(--radius-sm)]" />
        ) : error ? (
          <div className="flex items-center gap-1.5 text-sm text-[var(--danger)]">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="text-3xl font-bold tracking-tight text-[var(--fg)] tnum">
            {value}
          </div>
        )}
      </div>

      {hint && !loading && !error && (
        <p className="mt-2 text-xs text-[var(--fg-muted)]">{hint}</p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
