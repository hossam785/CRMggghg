'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { InstagramIcon } from '@/components/icons/instagram';
import { instagramUrl } from '@/lib/normalize/instagram';
import { waUrl } from '@/lib/normalize/phone';
import { Button } from '@/components/ui/button';

export interface OpenDmButtonProps {
  instagramHandle?: string | null;
  whatsappE164?: string | null;
  onOpened?: () => void;
  className?: string;
}

export function OpenDmButton({
  instagramHandle,
  whatsappE164,
  onOpened,
  className,
}: OpenDmButtonProps) {
  const t = useTranslations('followUps.actions');

  const url = instagramHandle
    ? instagramUrl(instagramHandle)
    : whatsappE164
    ? waUrl(whatsappE164)
    : null;

  const isInstagram = Boolean(instagramHandle);

  if (!url) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpened) {
      onOpened();
    }
  };

  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className={`h-8 gap-1.5 font-medium ${className || ''}`}
      onClick={handleClick}
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        {isInstagram ? (
          <InstagramIcon className="size-3.5 shrink-0" />
        ) : (
          <MessageCircle className="size-3.5 shrink-0 text-emerald-600" />
        )}
        <span>{t('openDm')}</span>
        <ExternalLink className="size-3 shrink-0 opacity-60" />
      </a>
    </Button>
  );
}
