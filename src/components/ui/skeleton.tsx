import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: 'rect' | 'circle' | 'text';
}

export function Skeleton({ className, shape = 'rect', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--surface-2)]',
        shape === 'circle' && 'rounded-full',
        shape === 'rect' && 'rounded-[var(--radius-md)]',
        shape === 'text' && 'h-4 w-full rounded-[var(--radius-sm)]',
        className
      )}
      {...props}
    />
  );
}
