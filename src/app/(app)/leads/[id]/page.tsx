'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Briefcase,
  Globe,
  Calendar,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { InstagramIcon as Instagram } from '@/components/icons/instagram';
import { Button } from '@/components/ui/button';
import { StageBadge } from '@/components/ui/stage-badge';
import { useLead, useIndustries, useCountries } from '@/features/leads/queries';
import { getCountryFlag } from '@/features/leads/components/fields/CountryCombobox';
import { instagramUrl } from '@/lib/normalize/instagram';
import { waUrl } from '@/lib/normalize/phone';
import Link from 'next/link';

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const locale = useLocale();

  const { data: lead, isLoading, isError } = useLead(id || '');
  const { data: industries = [] } = useIndustries();
  const { data: countries = [] } = useCountries();

  const industryLabel = React.useMemo(() => {
    if (!lead) return '—';
    if (lead.industry_other) return lead.industry_other;
    if (!lead.industry_id) return '—';
    const match = industries.find((i) => i.id === lead.industry_id);
    return match ? (locale === 'ar' ? match.label_ar : match.label_en) : '—';
  }, [lead, industries, locale]);

  const countryName = React.useMemo(() => {
    if (!lead?.country_code) return '';
    const match = countries.find((c) => c.code === lead.country_code);
    return match ? (locale === 'ar' ? match.name_ar : match.name_en) : lead.country_code;
  }, [lead, countries, locale]);

  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="size-8 animate-spin text-[var(--primary)]" />
        <span className="text-sm text-[var(--fg-muted)]">جاري تحميل بيانات العميل…</span>
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <h2 className="text-xl font-bold text-[var(--danger)]">العميل غير موجود</h2>
        <p className="text-sm text-[var(--fg-muted)] max-w-sm">
          قد يكون هذا العميل قد تم حذفه أو أن الرابط غير صحيح.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/leads" className="gap-2">
            <BackIcon className="size-4" />
            <span>العودة لقائمة العملاء</span>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          <BackIcon className="size-4" />
          <span>العودة</span>
        </Button>

        <StageBadge stage={lead.stage} size="md" />
      </div>

      {/* Header Info */}
      <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--fg)]">{lead.name}</h1>
          {lead.company && (
            <p className="text-sm sm:text-base text-[var(--fg-muted)]">{lead.company}</p>
          )}
          {lead.job_title && (
            <p className="text-xs sm:text-sm text-[var(--fg-muted)]">{lead.job_title}</p>
          )}
        </div>

        {/* Contact links */}
        <div className="flex flex-wrap gap-2 pt-2">
          {lead.instagram_handle && (
            <a
              href={instagramUrl(lead.instagram_handle)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20 hover:bg-pink-500/20 transition-colors dir-ltr"
            >
              <Instagram className="size-3.5 text-pink-600 shrink-0" />
              <span>@{lead.instagram_handle}</span>
            </a>
          )}

          {lead.whatsapp_e164 && (
            <a
              href={waUrl(lead.whatsapp_e164)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors dir-ltr"
            >
              <MessageCircle className="size-3.5 text-emerald-600 shrink-0" />
              <span>{lead.whatsapp_e164}</span>
            </a>
          )}
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border)] text-xs">
        <div className="space-y-1">
          <span className="text-[var(--fg-muted)] flex items-center gap-1">
            <Briefcase className="size-3" />
            <span>النشاط</span>
          </span>
          <p className="font-semibold text-[var(--fg)]">{industryLabel}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[var(--fg-muted)] flex items-center gap-1">
            <Globe className="size-3" />
            <span>الدولة</span>
          </span>
          <p className="font-semibold text-[var(--fg)] flex items-center gap-1">
            <span>{getCountryFlag(lead.country_code)}</span>
            <span>{countryName || '—'}</span>
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[var(--fg-muted)] flex items-center gap-1">
            <Calendar className="size-3" />
            <span>المتابعة القادمة</span>
          </span>
          <p className="font-semibold text-[var(--fg)] font-mono">
            {lead.next_follow_up_on || '—'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[var(--fg-muted)] flex items-center gap-1">
            <AlertTriangle className="size-3" />
            <span>اكتمال البيانات</span>
          </span>
          <p className="font-semibold text-[var(--fg)]">
            {lead.missing_fields && lead.missing_fields.length > 0
              ? `ناقص (${lead.missing_fields.length})`
              : 'مكتمل ✓'}
          </p>
        </div>
      </div>

      {/* Problems & Notes */}
      {lead.problems && (
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border)] space-y-1.5">
          <h3 className="text-xs font-semibold text-[var(--fg-muted)]">المشاكل والتحديات</h3>
          <p className="text-sm text-[var(--fg)] whitespace-pre-wrap">{lead.problems}</p>
        </div>
      )}

      {lead.notes && (
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border)] space-y-1.5">
          <h3 className="text-xs font-semibold text-[var(--fg-muted)]">الملاحظات</h3>
          <p className="text-sm text-[var(--fg)] whitespace-pre-wrap">{lead.notes}</p>
        </div>
      )}
    </div>
  );
}
