import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value?: string | null;
  onChange: (value: string | null) => void;
  allowDeselect?: boolean;
  className?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  allowDeselect = false,
  className,
  size = 'md',
  disabled = false,
}: SegmentedControlProps) {
  const handleClick = (optValue: string) => {
    if (disabled) return;
    if (allowDeselect && value === optValue) {
      onChange(null);
    } else {
      onChange(optValue);
    }
  };

  return (
    <div
      role="radiogroup"
      className={cn(
        'inline-flex items-center rounded-full bg-[var(--color-fog-surface,#f1f5f9)] dark:bg-slate-800/80 p-1 border border-[var(--color-stone-divider,#e2e8f0)] dark:border-slate-800 text-slate-500 dark:text-slate-400',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => handleClick(option.value)}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-full font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-royal-signal,#145aff)]/40',
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm',
              isSelected
                ? 'bg-white dark:bg-[#131c2e] text-[var(--color-midnight-ink,#020520)] dark:text-white shadow-2xs font-semibold'
                : 'hover:text-[var(--color-midnight-ink,#020520)] dark:hover:text-white text-slate-500 dark:text-slate-400'
            )}
          >
            {Icon && <Icon className="size-3.5 shrink-0" />}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
