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
        'inline-flex items-center rounded-[var(--radius-md)] bg-[var(--surface-2)] p-1 text-[var(--fg-muted)]',
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
              'flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] font-medium transition-all duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
              isSelected
                ? 'bg-[var(--surface)] text-[var(--fg)] shadow-xs font-semibold'
                : 'hover:text-[var(--fg)] text-[var(--fg-muted)]'
            )}
          >
            {Icon && <Icon className="size-4 shrink-0" />}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
