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
  Search,
  X,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterMode, setFilterMode] = React.useState<'all' | 'expiring'>('all');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [restoringId, setRestoringId] = React.useState<string | null>(null);

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

  // Filtered leads based on search & tab
  const filteredLeads = React.useMemo(() => {
    let result = leads;

    if (filterMode === 'expiring') {
      result = result.filter((lead) => getDaysLeft(lead.deleted_at) <= 3);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((lead) =>
        lead.name.toLowerCase().includes(q) ||
        (lead.instagram_handle && lead.instagram_handle.toLowerCase().includes(q)) ||
        (lead.whatsapp_e164 && lead.whatsapp_e164.includes(q)) ||
        (lead.company && lead.company.toLowerCase().includes(q))
      );
    }

    return result;
  }, [leads, filterMode, searchQuery, getDaysLeft]);

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
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  const isAllSelected = filteredLeads.length > 0 && selectedIds.size === filteredLeads.length;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < filteredLeads.length;

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

  const formatDeletedDate = (deletedAt: string | null) => {
    if (!deletedAt) return '—';
    const d = new Date(deletedAt);
    return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      dateStyle: 'medium',
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/leads"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5 rtl:rotate-180" />
              <span>{t('backToLeads')}</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
              <span>{t('title')}</span>
              {leads.length > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary px-3 py-0.5 text-xs font-semibold border border-primary/20">
                  {leads.length}
                </span>
              )}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
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
                className="rounded-full"
              >
                {tCommon('cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleBulkRestore}
                disabled={bulkRestoreMutation.isPending}
                className="gap-1.5 rounded-full shadow-sm"
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

      {/* Retention Notice Card */}
      <div className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-card/80 text-xs text-muted-foreground shadow-xs">
        <ShieldAlert className="size-4 shrink-0 text-amber-500 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground">فترة الاحتفاظ بالبيانات: 30 يوماً</span>
          <p>
            يتم الاحتفاظ بالعملاء المحذوفين لمدة 30 يوماً كاملة مع سجل ملاحظاتهم وتاريخهم بالكامل قبل إزالتهم نهائياً. يمكنك استعادتهم بضغطة واحدة في أي وقت.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      {leads.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث بالاسم، انستغرام، واتساب، أو الشركة…"
              className="ps-9 pe-9 h-9 rounded-full bg-card border-border text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="inline-flex rounded-full border border-border p-1 bg-card self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={cn(
                'px-3.5 py-1 text-xs font-semibold rounded-full transition-colors',
                filterMode === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              الكل ({leads.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('expiring')}
              className={cn(
                'px-3.5 py-1 text-xs font-semibold rounded-full transition-colors',
                filterMode === 'expiring'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              تنتهي قريباً ({leads.filter((l) => getDaysLeft(l.deleted_at) <= 3).length})
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="w-full border border-border rounded-2xl bg-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
            <div className="h-4 w-20 bg-muted/50 rounded animate-pulse" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="size-4 bg-muted/50 rounded animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 w-40 bg-muted/50 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted/50 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-6 w-20 bg-muted/50 rounded-full animate-pulse" />
                <div className="h-8 w-20 bg-muted/50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center space-y-3">
          <p className="text-sm text-destructive">
            {tCommon('retry')}
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()} className="rounded-full">
            {tCommon('retry')}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && leads.length === 0 && (
        <div className="flex flex-col items-center justify-center p-14 text-center rounded-2xl border border-border bg-card space-y-4 shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted/40 border border-border text-muted-foreground">
            <Trash2 className="size-6 stroke-[1.75]" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h2 className="text-base font-bold text-foreground">
              {t('emptyTitle')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('emptyDesc')}
            </p>
          </div>
          <Link href="/leads">
            <Button variant="outline" size="sm" className="gap-1.5 mt-2 rounded-full">
              <ArrowLeft className="size-3.5 rtl:rotate-180" />
              <span>{t('backToLeads')}</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Filtered Empty State */}
      {!isLoading && !isError && leads.length > 0 && filteredLeads.length === 0 && (
        <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card/50 text-xs text-muted-foreground">
          لا توجد نتائج مطابقة لبحثك في سلة المهملات
        </div>
      )}

      {/* Leads List */}
      {!isLoading && !isError && filteredLeads.length > 0 && (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block w-full border border-border rounded-2xl bg-card overflow-hidden shadow-sm">
            {/* Table Header */}
            <div
              role="row"
              className="flex items-center h-11 px-4 sm:px-6 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground select-none"
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
            <div className="divide-y divide-border/60">
              {filteredLeads.map((lead) => {
                const daysLeft = getDaysLeft(lead.deleted_at);
                const isSelected = selectedIds.has(lead.id);
                const isRestoring = restoringId === lead.id;

                return (
                  <div
                    key={lead.id}
                    role="row"
                    className={cn(
                      'flex items-center min-h-[58px] px-4 sm:px-6 hover:bg-muted/20 transition-colors',
                      isSelected && 'bg-primary/5'
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
                        <span className="font-semibold text-sm text-foreground truncate">
                          {lead.name}
                        </span>
                        {lead.country_code && (
                          <span className="text-xs" title={lead.country_code}>
                            {getCountryFlag(lead.country_code)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {lead.instagram_handle && (
                          <span className="inline-flex items-center gap-1 font-mono dir-ltr">
                            <Instagram className="size-3 text-pink-500" />
                            <bdi>@{lead.instagram_handle}</bdi>
                          </span>
                        )}
                        {lead.whatsapp_e164 && (
                          <span className="inline-flex items-center gap-1 font-mono dir-ltr">
                            <MessageCircle className="size-3 text-emerald-500" />
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
                    <div className="w-36 shrink-0 text-xs text-muted-foreground">
                      {formatDeletedDate(lead.deleted_at)}
                    </div>

                    {/* Days Left Badge */}
                    <div className="w-36 shrink-0">
                      {daysLeft === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/25">
                          {t('lastDay')}
                        </span>
                      ) : daysLeft <= 3 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                          {t('daysLeftPlural', { count: daysLeft })}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/60 text-muted-foreground border border-border">
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
                        className="gap-1.5 h-8 text-xs rounded-full hover:bg-primary/10 hover:text-primary hover:border-primary/30"
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
            {filteredLeads.map((lead) => {
              const daysLeft = getDaysLeft(lead.deleted_at);
              const isSelected = selectedIds.has(lead.id);
              const isRestoring = restoringId === lead.id;

              return (
                <div
                  key={lead.id}
                  className={cn(
                    'flex flex-col p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3',
                    isSelected && 'border-primary bg-primary/5'
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
                          <span className="font-semibold text-sm text-foreground">
                            {lead.name}
                          </span>
                          {lead.country_code && (
                            <span className="text-xs">
                              {getCountryFlag(lead.country_code)}
                            </span>
                          )}
                        </div>
                        {lead.company && (
                          <span className="text-xs text-muted-foreground">
                            {lead.company}
                          </span>
                        )}
                      </div>
                    </div>

                    <StageBadge stage={lead.stage} size="sm" />
                  </div>

                  {/* Handles */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    {lead.instagram_handle && (
                      <span className="inline-flex items-center gap-1 font-mono dir-ltr bg-muted/50 px-2 py-0.5 rounded-md">
                        <Instagram className="size-3 text-pink-500" />
                        <bdi>@{lead.instagram_handle}</bdi>
                      </span>
                    )}
                    {lead.whatsapp_e164 && (
                      <span className="inline-flex items-center gap-1 font-mono dir-ltr bg-muted/50 px-2 py-0.5 rounded-md">
                        <MessageCircle className="size-3 text-emerald-500" />
                        <bdi>{lead.whatsapp_e164}</bdi>
                      </span>
                    )}
                  </div>

                  {/* Footer Meta & Restore Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="space-y-1">
                      <div className="text-[11px] text-muted-foreground">
                        {t('deletedAt')}: {formatDeletedDate(lead.deleted_at)}
                      </div>
                      <div>
                        {daysLeft === 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/25">
                            {t('lastDay')}
                          </span>
                        ) : daysLeft <= 3 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                            {t('daysLeftPlural', { count: daysLeft })}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border">
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
                      className="gap-1 h-8 text-xs rounded-full hover:bg-primary/10 hover:text-primary hover:border-primary/30"
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

