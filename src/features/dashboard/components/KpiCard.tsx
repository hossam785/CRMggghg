import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number | string;
  delta?: {
    formatted: string;
    direction: 'up' | 'down' | 'neutral';
  };
  hint: string;
  icon?: React.ReactNode;
  href?: string;
  className?: string;
}

export function KpiCard({
  title,
  value,
  delta,
  hint,
  icon,
  href,
  className = '',
}: KpiCardProps) {
  const content = (
    <div
      className={`relative rounded-2xl border border-border bg-card p-5 shadow-xs transition-all duration-200 ${
        href ? 'hover:border-primary/40 hover:shadow-sm cursor-pointer group' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-muted-foreground line-clamp-1">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {icon && (
            <div className="size-8 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          {href && (
            <ArrowUpRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors rtl:-scale-x-100" />
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-2.5 mb-2">
        <span className="text-2xl sm:text-3xl font-black text-foreground tabular-nums tracking-tight">
          {typeof value === 'number' ? value.toLocaleString('ar-EG') : value}
        </span>

        {delta && (
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-bold tabular-nums ${
              delta.direction === 'up'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : delta.direction === 'down'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {delta.direction === 'up' && <TrendingUp className="size-3" />}
            {delta.direction === 'down' && <TrendingDown className="size-3" />}
            {delta.direction === 'neutral' && <Minus className="size-3" />}
            <span>{delta.formatted}</span>
          </span>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground line-clamp-1">{hint}</p>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}
