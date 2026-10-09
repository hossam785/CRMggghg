'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { MessageCircle, AlertTriangle, MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { InstagramIcon as Instagram } from '@/components/icons/instagram';
import { StageBadge } from '@/components/ui/stage-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSoftDeleteLead, useRestoreLead } from '../queries';
import { PrimaryActionButton } from '@/features/pipeline/components/PrimaryActionButton';
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
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const softDeleteMutation = useSoftDeleteLead();
  const restoreMutation = useRestoreLead();

  const handleDeleteConfirm = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    softDeleteMutation.mutate(lead.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        toast.success(t('leadDeletedToast', { name: lead.name }), {
          duration: 6000,
          action: {
            label: tCommon('undo'),
            onClick: () => {
              restoreMutation.mutate(lead.id);
            },
          },
        });
      },
    });
  };

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

  // Next follow-up info with overdue indicator
  const nextFollowUpInfo = React.useMemo(() => {
    if (!lead.next_follow_up_on) return null;
    try {
      const parts = lead.next_follow_up_on.split('-').map(Number);
      const target = new Date(parts[0] || 2026, (parts[1] || 1) - 1, parts[2] || 1);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);

      const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return { text: locale === 'ar' ? 'اليوم' : 'Today', isOverdue: false, isToday: true };
      }
      if (diffDays === 1) {
        return { text: locale === 'ar' ? 'غداً' : 'Tomorrow', isOverdue: false, isToday: false };
      }
      if (diffDays === 2) {
        return { text: locale === 'ar' ? 'بعد يومين' : 'in 2 days', isOverdue: false, isToday: false };
      }
      if (diffDays > 2) {
        return {
          text: locale === 'ar' ? `خلال ${diffDays} أيام` : `in ${diffDays} days`,
          isOverdue: false,
          isToday: false,
        };
      }
      const overdueDays = Math.abs(diffDays);
      return {
        text:
          locale === 'ar'
            ? overdueDays === 1
              ? 'متأخر يوم'
              : overdueDays === 2
              ? 'متأخر يومين'
              : `متأخر ${overdueDays} أيام`
            : `Overdue ${overdueDays}d`,
        isOverdue: true,
        isToday: false,
      };
    } catch {
      return { text: lead.next_follow_up_on, isOverdue: false, isToday: false };
    }
  }, [lead.next_follow_up_on, locale]);

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

        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <StageBadge stage={lead.stage} size="sm" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 p-0 text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">{t('moreOptions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteDialogOpen(true);
                }}
                className="text-[var(--danger)] focus:text-[var(--danger)] focus:bg-[var(--danger)]/10 cursor-pointer"
              >
                <Trash2 className="size-4 me-2" />
                <span>{t('deleteLead')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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

      {/* Bottom Meta & Quick Action */}
      <div className="flex items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-[var(--border)]">
        <div className="flex flex-col min-w-0 text-xs text-[var(--fg-muted)]">
          <div className="flex items-center gap-1.5 truncate">
            {lead.country_code && (
              <span title={countryName}>{getCountryFlag(lead.country_code)}</span>
            )}
            {industryLabel && <span className="truncate">{industryLabel}</span>}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--fg-muted)] mt-0.5" title={contactFull}>
            <span>{contactRelative}</span>
            {nextFollowUpInfo && (
              <>
                <span>•</span>
                <span
                  className={cn(
                    nextFollowUpInfo.isOverdue && 'text-[var(--danger)] font-semibold',
                    nextFollowUpInfo.isToday && 'text-[var(--primary)] font-semibold',
                    !nextFollowUpInfo.isOverdue && !nextFollowUpInfo.isToday && 'text-[var(--fg-muted)]'
                  )}
                  title={lead.next_follow_up_on || undefined}
                >
                  {nextFollowUpInfo.text}
                </span>
              </>
            )}
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <PrimaryActionButton lead={lead} size="sm" className="h-7 text-xs px-2.5" />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader className="text-start">
            <DialogTitle className="text-base font-bold text-[var(--fg)]">
              {t('deleteConfirmTitle')}
            </DialogTitle>
            <DialogDescription className="text-sm text-[var(--fg-muted)] mt-1.5">
              {t('deleteConfirmDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleteDialogOpen(false);
              }}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={softDeleteMutation.isPending}
            >
              {t('deleteConfirmAction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
