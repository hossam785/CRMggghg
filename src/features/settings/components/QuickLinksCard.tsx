'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { FileSpreadsheet, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';

export function QuickLinksCard() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-lg font-bold text-foreground">{t('quickLinks')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('quickLinksDesc')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Data Hub Link */}
        <Link
          href="/data"
          className="group flex items-start gap-3.5 p-4 rounded-xl border border-border bg-background hover:bg-muted/30 hover:border-primary/50 transition-all shadow-xs"
        >
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {t('dataHub')}
              </span>
              <ArrowIcon className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {t('dataHubDesc')}
            </p>
          </div>
        </Link>

        {/* Trash Link */}
        <Link
          href="/trash"
          className="group flex items-start gap-3.5 p-4 rounded-xl border border-border bg-background hover:bg-muted/30 hover:border-destructive/40 transition-all shadow-xs"
        >
          <div className="p-2 rounded-lg bg-destructive/10 text-destructive shrink-0 group-hover:scale-105 transition-transform">
            <Trash2 className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground group-hover:text-destructive transition-colors">
                {t('trash')}
              </span>
              <ArrowIcon className="size-4 text-muted-foreground group-hover:text-destructive group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {t('trashDesc')}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
