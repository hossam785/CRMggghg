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
        href
          ? 'hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group'
          : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-muted-foreground line-clamp-1">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {icon && (
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
              {icon}
            </div>
          )}
          {href && (
            <ArrowUpRight className="size-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all rtl:group-hover:-translate-x-0.5 rtl:-scale-x-100" />
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-2.5 mb-2">
        <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight">
          {typeof value === 'number' ? value.toLocaleString('ar-EG') : value}
        </span>

        {delta && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums border ${
              delta.direction === 'up'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : delta.direction === 'down'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-muted/40 text-muted-foreground border-border/40'
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

