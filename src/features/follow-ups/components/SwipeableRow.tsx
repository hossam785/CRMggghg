'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';

export interface SwipeableRowProps {
  children: React.ReactNode;
  onSwipeAction?: () => void;
  disabled?: boolean;
  className?: string;
}

export function SwipeableRow({
  children,
  onSwipeAction,
  disabled = false,
  className,
}: SwipeableRowProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [offsetX, setOffsetX] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const startXRef = React.useRef(0);
  const currentXRef = React.useRef(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hasVibratedRef = React.useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    startXRef.current = e.clientX;
    currentXRef.current = e.clientX;
    setIsDragging(true);
    hasVibratedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled) return;
    currentXRef.current = e.clientX;
    const delta = currentXRef.current - startXRef.current;

    // Direct offset relative to direction
    const directedDelta = isRtl ? -delta : delta;

    if (containerRef.current) {
      const width = containerRef.current.offsetWidth || 300;
      const threshold = width * 0.35;

      // Allow dragging up to 120px in positive direction
      if (directedDelta > 0) {
        setOffsetX(Math.min(delta, 120));

        if (directedDelta >= threshold && !hasVibratedRef.current) {
          hasVibratedRef.current = true;
          try {
            navigator?.vibrate?.(10);
          } catch {
            // Ignore haptic errors
          }
        }
      } else {
        setOffsetX(0);
      }
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (containerRef.current) {
      const width = containerRef.current.offsetWidth || 300;
      const threshold = width * 0.35;
      const delta = currentXRef.current - startXRef.current;
      const directedDelta = isRtl ? -delta : delta;

      if (directedDelta >= threshold && onSwipeAction) {
        onSwipeAction();
      }
    }

    setOffsetX(0);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative touch-pan-y select-none overflow-hidden ${className || ''}`}
      style={{
        transform: `translateX(${offsetX}px)`,
        transition: isDragging ? 'none' : 'transform 180ms ease-out',
      }}
    >
      {children}
    </div>
  );
}
