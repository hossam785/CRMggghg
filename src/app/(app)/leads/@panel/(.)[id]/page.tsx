'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  X,
  ExternalLink,
  MessageCircle,
  Briefcase,
  Globe,
  Calendar,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { InstagramIcon as Instagram } from '@/components/icons/instagram';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { StageBadge } from '@/components/ui/stage-badge';
import { useLead, useIndustries, useCountries } from '@/features/leads/queries';
import { getCountryFlag } from '@/features/leads/components/fields/CountryCombobox';
import { instagramUrl } from '@/lib/normalize/instagram';
import { waUrl } from '@/lib/normalize/phone';

export default function LeadPanelIntercept() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const locale = useLocale();

  const [open, setOpen] = React.useState(true);

  const { data: lead, isLoading, isError } = useLead(id || '');
  const { data: industries = [] } = useIndustries();
  const { data: countries = [] } = useCountries();

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setOpen(false);
      router.back();
    }
  };

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

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="end"
        className="hidden lg:flex flex-col w-full sm:max-w-xl p-0 gap-0 overflow-hidden bg-[var(--surface)] border-s border-[var(--border)] shadow-xl"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 bg-[var(--surface-2)]/40 shrink-0">
          <SheetHeader className="text-start">
            <SheetTitle className="text-lg font-bold text-[var(--fg)] truncate">
              {lead?.name || 'تفاصيل العميل'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex items-center gap-2">
            {lead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  router.push(`/leads/${lead.id}`);
                }}
                className="h-8 px-2 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] gap-1"
                title="فتح الصفحة كاملة"
              >
                <ExternalLink className="size-3.5" />
                <span>الصفحة كاملة</span>
              </Button>
            )}
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="p-1 rounded-[var(--radius-sm)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)] transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--fg-muted)] gap-3">
              <Loader2 className="size-6 animate-spin text-[var(--primary)]" />
              <span className="text-sm">جاري تحميل بيانات العميل…</span>
            </div>
          ) : isError || !lead ? (
            <div className="text-center py-20 text-[var(--danger)]">
              لم يتم العثور على العميل أو تم حذفه.
            </div>
          ) : (
            <>
              {/* Header Info */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-[var(--fg)]">{lead.name}</h2>
                  {lead.company && (
                    <p className="text-sm text-[var(--fg-muted)]">{lead.company}</p>
                  )}
                  {lead.job_title && (
                    <p className="text-xs text-[var(--fg-muted)]">{lead.job_title}</p>
                  )}
                </div>
                <StageBadge stage={lead.stage} size="md" />
              </div>

              {/* Contact Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {lead.instagram_handle && (
                  <a
                    href={instagramUrl(lead.instagram_handle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20 hover:bg-pink-500/20 transition-colors dir-ltr"
                  >
                    <Instagram className="size-3.5 text-pink-600 shrink-0" />
                    <span>@{lead.instagram_handle}</span>
                    <ExternalLink className="size-3 opacity-60" />
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
                    <ExternalLink className="size-3 opacity-60" />
                  </a>
                )}
              </div>

              {/* Key Meta Grid */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--surface-2)]/60 border border-[var(--border)] text-xs">
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

              {/* Notes & Problems */}
              {lead.problems && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-[var(--fg-muted)]">المشاكل والتحديات</h4>
                  <p className="text-sm p-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--fg)] whitespace-pre-wrap">
                    {lead.problems}
                  </p>
                </div>
              )}

              {lead.notes && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-[var(--fg-muted)]">الملاحظات</h4>
                  <p className="text-sm p-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--fg)] whitespace-pre-wrap">
                    {lead.notes}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
