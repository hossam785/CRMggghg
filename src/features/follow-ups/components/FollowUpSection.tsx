'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FollowUpCard } from './FollowUpCard';
import { type FollowUpQueueRow } from '@/types/database';

export interface FollowUpSectionProps {
  title: string;
  count: number;
  items: FollowUpQueueRow[];
  icon?: React.ComponentType<{ className?: string }>;
  dotColor?: string;
  defaultOpen?: boolean;
  isCollapsible?: boolean;
  viewAllUrl?: string;
  viewAllText?: string;
}

export function FollowUpSection({
  title,
  count,
  items,
  icon: Icon,
  dotColor = 'bg-primary',
  defaultOpen = true,
  isCollapsible = false,
  viewAllUrl,
  viewAllText,
}: FollowUpSectionProps) {
  const t = useTranslations('followUps.actions');
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  if (count === 0 && !isCollapsible) return null;

  return (
    <div className="space-y-3">
      {/* Relate Section Header with 5px Status Dot */}
      <div className="flex items-center justify-between px-1">
        <div
          className={`flex items-center gap-2.5 select-none ${
            isCollapsible ? 'cursor-pointer' : ''
          }`}
          onClick={() => {
            if (isCollapsible) setIsOpen(!isOpen);
          }}
        >
          {/* 5px Status Dot with soft glow */}
          <span
            className={`size-[6px] rounded-full shrink-0 ring-4 ring-muted/40 ${dotColor}`}
            aria-hidden="true"
          />
          {Icon && <Icon className="size-4 text-muted-foreground shrink-0" />}
          <h2 className="text-sm font-bold text-foreground">
            {title}
          </h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-muted/40 text-muted-foreground border border-border shadow-2xs">
            {count}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {viewAllUrl && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs font-semibold rounded-full text-primary hover:bg-primary/10 gap-1"
            >
              <Link href={viewAllUrl}>
                <span>{viewAllText || t('viewAllWaiting', { count })}</span>
                <ExternalLink className="size-3" />
              </Link>
            </Button>
          )}

          {isCollapsible && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Cards List */}
      {isOpen && (
        <div className="space-y-2.5">
          {items.map((item) => (
            <FollowUpCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
