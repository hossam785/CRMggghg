import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  label?: string;
  onCancel?: () => void;
}

export const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value = 0, label, onCancel, ...props }, ref) => (
  <div className="w-full space-y-1.5">
    {(label || onCancel) && (
      <div className="flex items-center justify-between text-xs font-medium text-[var(--fg-muted)]">
        {label && <span>{label}</span>}
        <div className="flex items-center gap-2">
          <span className="tnum">{Math.round(value ?? 0)}%</span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-[var(--radius-sm)] p-0.5 hover:bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
              aria-label="إلغاء العملية"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    )}
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="size-full flex-1 bg-[var(--primary)] transition-all duration-[var(--dur-base)]"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  </div>
));
Progress.displayName = ProgressPrimitive.Root.displayName;
