'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import {
  Trash2,
  RotateCcw,
  ArrowLeft,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { StageBadge } from '@/components/ui/stage-badge';
import { InstagramIcon as Instagram } from '@/components/icons/instagram';
import { getCountryFlag } from '@/features/leads/components/fields/CountryCombobox';
import { useTrashLeads, useBulkRestoreLeads, useRestoreLead } from '@/features/leads/queries';
import { ExportButton, createTrashExportSpec } from '@/features/data-hub/export';
import type { Lead } from '@/features/leads/schema';
import { cn } from '@/lib/utils';

export default function TrashPage() {
  const t = useTranslations('trash');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const trashExportSpec = React.useMemo(() => createTrashExportSpec(), []);
  const { data: leads = [], isLoading, isError, refetch } = useTrashLeads();
  const restoreMutation = useRestoreLead();
  const bulkRestoreMutation = useBulkRestoreLeads();

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [restoringId, setRestoringId] = React.useState<string | null>(null);

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)));
    }
  };

  const isAllSelected = leads.length > 0 && selectedIds.size === leads.length;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < leads.length;

  // Single restore
  const handleRestore = (lead: Lead) => {
    setRestoringId(lead.id);
    restoreMutation.mutate(lead.id, {
      onSuccess: () => {
        setRestoringId(null);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(lead.id);
          return next;
        });
        toast.success(t('restoreSuccess', { name: lead.name }));
      },
      onError: (err: unknown) => {
        setRestoringId(null);
        const appErr = err as { code?: string; message?: string };
        if (appErr.code === 'DUPLICATE_INSTAGRAM') {
          toast.error(t('restoreDuplicateHandle'));
        } else if (appErr.code === 'DUPLICATE_WHATSAPP') {
          toast.error(t('restoreDuplicatePhone'));
        } else {
          toast.error(t('restoreFailed'));
        }
      },
    });
  };

  // Bulk restore
  const handleBulkRestore = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    bulkRestoreMutation.mutate(ids, {
      onSuccess: () => {
        toast.success(t('bulkRestoreSuccess', { count: ids.length }));
        setSelectedIds(new Set());
      },
      onError: (err: unknown) => {
        const appErr = err as { code?: string; message?: string };
        if (appErr.code === 'DUPLICATE_INSTAGRAM') {
          toast.error(t('restoreDuplicateHandle'));
        } else if (appErr.code === 'DUPLICATE_WHATSAPP') {
          toast.error(t('restoreDuplicatePhone'));
        } else {
          toast.error(t('restoreFailed'));
        }
      },
    });
  };

  const [now] = React.useState(() => Date.now());

  // Days left calculation
  const getDaysLeft = React.useCallback(
    (deletedAt: string | null) => {
      if (!deletedAt) return 30;
      const ageMs = now - new Date(deletedAt).getTime();
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
      return Math.max(0, 30 - ageDays);
    },
    [now]
  );

  const formatDeletedDate = (deletedAt: string | null) => {
    if (!deletedAt) return '—';
    const d = new Date(deletedAt);
    return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      dateStyle: 'medium',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/leads"
              className="inline-flex items-center gap-1 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
            >
              <ArrowLeft className="size-3.5 rtl:rotate-180" />
              <span>{t('backToLeads')}</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)] sm:text-3xl flex items-center gap-2">
              <span>{t('title')}</span>
              {leads.length > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[var(--fg-muted)] border border-[var(--border)]">
                  {leads.length}
                </span>
              )}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--fg-muted)]">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton spec={trashExportSpec} />

          {/* Bulk Action Controls */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in-0 duration-150">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              disabled={bulkRestoreMutation.isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleBulkRestore}
              disabled={bulkRestoreMutation.isPending}
              className="gap-1.5"
            >
              {bulkRestoreMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              <span>{t('restoreSelected', { count: selectedIds.size })}</span>
            </Button>
          </div>
        )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="w-full border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--surface)] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="h-4 w-32 bg-[var(--surface-2)] rounded animate-pulse" />
            <div className="h-4 w-20 bg-[var(--surface-2)] rounded animate-pulse" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)]/50 last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="size-4 bg-[var(--surface-2)] rounded animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 w-40 bg-[var(--surface-2)] rounded animate-pulse" />
                  <div className="h-3 w-24 bg-[var(--surface-2)] rounded animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-6 w-20 bg-[var(--surface-2)] rounded-full animate-pulse" />
                <div className="h-8 w-20 bg-[var(--surface-2)] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-8 text-center space-y-3">
          <p className="text-sm text-[var(--danger)]">
            {tCommon('retry')}
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {tCommon('retry')}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && leads.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-2xs">
          <div className="flex size-14 items-center justify-center rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg-muted)]">
            <Trash2 className="size-6 stroke-[1.75]" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h2 className="text-base font-bold text-[var(--fg)]">
              {t('emptyTitle')}
            </h2>
            <p className="text-xs text-[var(--fg-muted)]">
              {t('emptyDesc')}
            </p>
          </div>
          <Link href="/leads">
            <Button variant="outline" size="sm" className="gap-1.5 mt-2">
              <ArrowLeft className="size-3.5 rtl:rotate-180" />
              <span>{t('backToLeads')}</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Leads List */}
      {!isLoading && !isError && leads.length > 0 && (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block w-full border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--surface)] overflow-hidden shadow-2xs">
            {/* Table Header */}
            <div
              role="row"
              className="flex items-center h-11 px-4 sm:px-6 border-b border-[var(--border)] bg-[var(--surface-2)]/90 backdrop-blur-sm text-xs font-semibold text-[var(--fg-muted)] select-none"
            >
              <div className="w-8 shrink-0 flex items-center">
                <Checkbox
                  checked={isAllSelected ? true : isPartiallySelected ? 'indeterminate' : false}
                  onCheckedChange={handleSelectAll}
                  aria-label={t('selectAll')}
                />
              </div>
              <div className="flex-1 pe-4">{t('lead')}</div>
              <div className="w-36 shrink-0">{t('stage')}</div>
              <div className="w-36 shrink-0">{t('deletedAt')}</div>
              <div className="w-36 shrink-0">{t('remainingTime')}</div>
              <div className="w-28 shrink-0 text-end">{t('actions')}</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-[var(--border)]">
              {leads.map((lead) => {
                const daysLeft = getDaysLeft(lead.deleted_at);
                const isSelected = selectedIds.has(lead.id);
                const isRestoring = restoringId === lead.id;

                return (
                  <div
                    key={lead.id}
                    role="row"
                    className={cn(
                      'flex items-center min-h-[56px] px-4 sm:px-6 hover:bg-[var(--surface-2)]/40 transition-colors',
                      isSelected && 'bg-[var(--primary)]/5'
                    )}
                  >
                    {/* Checkbox */}
                    <div className="w-8 shrink-0 flex items-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelect(lead.id)}
                        aria-label={`Select ${lead.name}`}
                      />
                    </div>

                    {/* Lead Info */}
                    <div className="flex-1 min-w-[240px] pe-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[var(--fg)] truncate">
                          {lead.name}
                        </span>
                        {lead.country_code && (
                          <span className="text-xs" title={lead.country_code}>
                            {getCountryFlag(lead.country_code)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)] mt-0.5">
                        {lead.instagram_handle && (
                          <span className="inline-flex items-center gap-1 font-mono dir-ltr">
                            <Instagram className="size-3 text-pink-600" />
                            <bdi>@{lead.instagram_handle}</bdi>
                          </span>
                        )}
                        {lead.whatsapp_e164 && (
                          <span className="inline-flex items-center gap-1 font-mono dir-ltr">
                            <MessageCircle className="size-3 text-emerald-600" />
                            <bdi>{lead.whatsapp_e164}</bdi>
                          </span>
                        )}
                        {lead.company && (
                          <span className="truncate">· {lead.company}</span>
                        )}
                      </div>
                    </div>

                    {/* Stage */}
                    <div className="w-36 shrink-0 flex items-center">
                      <StageBadge stage={lead.stage} size="sm" />
                    </div>

                    {/* Deleted Date */}
                    <div className="w-36 shrink-0 text-xs text-[var(--fg-muted)]">
                      {formatDeletedDate(lead.deleted_at)}
                    </div>

                    {/* Days Left Badge */}
                    <div className="w-36 shrink-0">
                      {daysLeft === 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          {t('lastDay')}
                        </span>
                      ) : daysLeft <= 3 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          {t('daysLeftPlural', { count: daysLeft })}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--surface-2)] text-[var(--fg-muted)] border border-[var(--border)]">
                          {t('daysLeft', { count: daysLeft })}
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    <div className="w-28 shrink-0 flex items-center justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(lead)}
                        disabled={isRestoring || bulkRestoreMutation.isPending}
                        className="gap-1.5 h-8 text-xs"
                      >
                        {isRestoring ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="size-3.5" />
                        )}
                        <span>{t('restore')}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {leads.map((lead) => {
              const daysLeft = getDaysLeft(lead.deleted_at);
              const isSelected = selectedIds.has(lead.id);
              const isRestoring = restoringId === lead.id;

              return (
                <div
                  key={lead.id}
                  className={cn(
                    'flex flex-col p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-2xs space-y-3',
                    isSelected && 'border-[var(--primary)] bg-[var(--primary)]/5'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelect(lead.id)}
                        aria-label={`Select ${lead.name}`}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-[var(--fg)]">
                            {lead.name}
                          </span>
                          {lead.country_code && (
                            <span className="text-xs">
                              {getCountryFlag(lead.country_code)}
                            </span>
                          )}
                        </div>
                        {lead.company && (
                          <span className="text-xs text-[var(--fg-muted)]">
                            {lead.company}
                          </span>
                        )}
                      </div>
                    </div>

                    <StageBadge stage={lead.stage} size="sm" />
                  </div>

                  {/* Handles */}
                  <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)] flex-wrap">
                    {lead.instagram_handle && (
                      <span className="inline-flex items-center gap-1 font-mono dir-ltr bg-[var(--surface-2)] px-2 py-0.5 rounded-sm">
                        <Instagram className="size-3 text-pink-600" />
                        <bdi>@{lead.instagram_handle}</bdi>
                      </span>
                    )}
                    {lead.whatsapp_e164 && (
                      <span className="inline-flex items-center gap-1 font-mono dir-ltr bg-[var(--surface-2)] px-2 py-0.5 rounded-sm">
                        <MessageCircle className="size-3 text-emerald-600" />
                        <bdi>{lead.whatsapp_e164}</bdi>
                      </span>
                    )}
                  </div>

                  {/* Footer Meta & Restore Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                    <div className="space-y-1">
                      <div className="text-[11px] text-[var(--fg-muted)]">
                        {t('deletedAt')}: {formatDeletedDate(lead.deleted_at)}
                      </div>
                      <div>
                        {daysLeft === 0 ? (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            {t('lastDay')}
                          </span>
                        ) : daysLeft <= 3 ? (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            {t('daysLeftPlural', { count: daysLeft })}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[11px] font-medium bg-[var(--surface-2)] text-[var(--fg-muted)] border border-[var(--border)]">
                            {t('daysLeft', { count: daysLeft })}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(lead)}
                      disabled={isRestoring || bulkRestoreMutation.isPending}
                      className="gap-1 h-8 text-xs"
                    >
                      {isRestoring ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="size-3.5" />
                      )}
                      <span>{t('restore')}</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
