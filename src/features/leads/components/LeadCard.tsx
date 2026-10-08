'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { MessageCircle, AlertTriangle, Calendar } from 'lucide-react';
import { InstagramIcon as Instagram } from '@/components/icons/instagram';
import { StageBadge } from '@/components/ui/stage-badge';
import { Highlight } from './Highlight';
import { getCountryFlag } from './fields/CountryCombobox';
import { instagramUrl } from '@/lib/normalize/instagram';
import { waUrl } from '@/lib/normalize/phone';
import { cn } from '@/lib/utils';
import type { LeadListRow } from '../schema';
import type { Industry, Country } from '../api';

export interface LeadCardProps {
  lead: LeadListRow;
  searchQuery?: string;
  industries?: Industry[];
  countries?: Country[];
  onClick?: () => void;
  className?: string;
}

export function LeadCard({
  lead,
  searchQuery,
  industries = [],
  countries = [],
  onClick,
  className,
}: LeadCardProps) {
  const router = useRouter();
  const t = useTranslations('leads');
  const locale = useLocale();

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/leads/${lead.id}`);
    }
  };

  // Resolve industry
  const industryLabel = React.useMemo(() => {
    if (lead.industry_other) return lead.industry_other;
    if (!lead.industry_id) return '';
    const match = industries.find((i) => i.id === lead.industry_id);
    return match ? (locale === 'ar' ? match.label_ar : match.label_en) : '';
  }, [lead.industry_id, lead.industry_other, industries, locale]);

  // Resolve country
  const countryName = React.useMemo(() => {
    if (!lead.country_code) return '';
    const match = countries.find((c) => c.code === lead.country_code);
    return match ? (locale === 'ar' ? match.name_ar : match.name_en) : lead.country_code;
  }, [lead.country_code, countries, locale]);

  // Relative contact
  const { contactRelative, contactFull } = React.useMemo(() => {
    if (!lead.last_contacted_at) {
      return {
        contactRelative: locale === 'ar' ? 'لم يتم التواصل' : 'Never',
        contactFull: '',
      };
    }
    const d = new Date(lead.last_contacted_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    const full = d.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    if (diffDays <= 0) return { contactRelative: locale === 'ar' ? 'اليوم' : 'Today', contactFull: full };
    if (diffDays === 1) return { contactRelative: locale === 'ar' ? 'أمس' : 'Yesterday', contactFull: full };

    const rtf = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { numeric: 'auto' });
    return { contactRelative: rtf.format(-diffDays, 'day'), contactFull: full };
  }, [lead.last_contacted_at, locale]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={cn(
        'group flex flex-col p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] select-none transition-all shadow-2xs hover:border-[var(--primary)]/40 hover:shadow-xs active:bg-[var(--surface-2)] cursor-pointer',
        className
      )}
    >
      {/* Top Header: Name & Stage Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-base text-[var(--fg)] truncate">
              <Highlight text={lead.name} query={searchQuery} />
            </span>

            {lead.missing_fields && lead.missing_fields.length > 0 && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-xs text-[10px] font-medium bg-[var(--warning)]/15 text-[var(--warning-fg,#b45309)] border border-[var(--warning)]/30 shrink-0"
                title={locale === 'ar' ? `بيانات ناقصة: ${lead.missing_fields.join(', ')}` : `Missing: ${lead.missing_fields.join(', ')}`}
              >
                <AlertTriangle className="size-2.5" />
                <span>
                  {locale === 'ar' ? `ناقص ${lead.missing_fields.length}` : `Missing ${lead.missing_fields.length}`}
                </span>
              </span>
            )}
          </div>

          {lead.company && (
            <span className="text-xs text-[var(--fg-muted)] truncate mt-0.5">
              {lead.company}
            </span>
          )}
        </div>

        <StageBadge stage={lead.stage} size="sm" className="shrink-0" />
      </div>

      {/* Middle Row: Handle & Contact links */}
      <div className="flex items-center gap-3 mt-2 text-xs text-[var(--fg-muted)] flex-wrap">
        {lead.instagram_handle && (
          <a
            href={instagramUrl(lead.instagram_handle)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={t('openProfile')}
            className="inline-flex items-center gap-1 font-mono text-xs text-[var(--fg)] hover:text-pink-600 bg-[var(--surface-2)] px-2 py-0.5 rounded-sm transition-colors dir-ltr"
          >
            <Instagram className="size-3 text-pink-600 shrink-0" />
            <bdi>@{lead.instagram_handle}</bdi>
          </a>
        )}

        {lead.whatsapp_e164 && (
          <a
            href={waUrl(lead.whatsapp_e164)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={t('openChat')}
            className="inline-flex items-center gap-1 font-mono text-xs text-[var(--fg)] hover:text-emerald-600 bg-[var(--surface-2)] px-2 py-0.5 rounded-sm transition-colors dir-ltr"
          >
            <MessageCircle className="size-3 text-emerald-600 shrink-0" />
            <bdi>{lead.whatsapp_e164}</bdi>
          </a>
        )}
      </div>

      {/* Bottom Meta: Industry, Country, Last Contact & Next Follow-up */}
      <div className="flex items-center justify-between text-xs text-[var(--fg-muted)] pt-2.5 mt-2.5 border-t border-[var(--border)]">
        <div className="flex items-center gap-1.5 truncate me-2">
          {lead.country_code && (
            <span title={countryName}>{getCountryFlag(lead.country_code)}</span>
          )}
          {industryLabel && <span className="truncate">{industryLabel}</span>}
        </div>

        <div className="flex items-center gap-2 shrink-0 text-end" title={contactFull}>
          <span>{contactRelative}</span>
          {lead.next_follow_up_on && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--primary)] font-mono bg-[var(--primary)]/10 px-1.5 py-0.2 rounded-xs">
              <Calendar className="size-2.5" />
              <span>{lead.next_follow_up_on}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
