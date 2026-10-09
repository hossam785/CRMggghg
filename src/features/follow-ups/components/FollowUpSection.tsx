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
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-2 select-none ${
            isCollapsible ? 'cursor-pointer' : ''
          }`}
          onClick={() => {
            if (isCollapsible) setIsOpen(!isOpen);
          }}
        >
          {Icon && <Icon className="size-4 text-[var(--fg-muted)] shrink-0" />}
          <h2 className="text-sm font-bold text-[var(--fg)]">{title}</h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--surface-2)] text-[var(--fg-muted)] border border-[var(--border)]">
            {count}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {viewAllUrl && (
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-[var(--primary)] gap-1">
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
              className="size-7"
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
