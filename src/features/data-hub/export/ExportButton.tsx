'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Download, FileSpreadsheet, Loader2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { runExport } from './run-export';
import type { ExportSpec } from './types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ExportButtonProps<Row = Record<string, unknown>> {
  spec: ExportSpec<Row>;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  className?: string;
  label?: string;
}

export function ExportButton<Row = Record<string, unknown>>({
  spec,
  variant = 'outline',
  size = 'sm',
  className,
  label,
}: ExportButtonProps<Row>) {
  const t = useTranslations('data');
  const appLocale = useLocale() as 'ar' | 'en';

  const [open, setOpen] = React.useState(false);
  const [format, setFormat] = React.useState<'xlsx' | 'csv'>('xlsx');
  const [headerLocale, setHeaderLocale] = React.useState<'ar' | 'en'>(appLocale);

  // Column selection with localStorage persistence
  const storageKey = `scope_export_cols_${spec.id}`;
  const allColumns = spec.sheets[0]?.columns || [];

  const [selectedColKeys, setSelectedColKeys] = React.useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return allColumns.map((c) => c.key);
  });

  // Export progress & cancellation state
  const [isExporting, setIsExporting] = React.useState(false);
  const [progressState, setProgressState] = React.useState({
    processed: 0,
    total: 0,
    percent: 0,
  });
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleToggleCol = (colKey: string) => {
    setSelectedColKeys((prev) => {
      const next = prev.includes(colKey)
        ? prev.filter((k) => k !== colKey)
        : [...prev, colKey];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleSelectAll = () => {
    const all = allColumns.map((c) => c.key);
    setSelectedColKeys(all);
    try {
      localStorage.setItem(storageKey, JSON.stringify(all));
    } catch {}
  };

  const handleDeselectAll = () => {
    setSelectedColKeys([]);
    try {
      localStorage.setItem(storageKey, JSON.stringify([]));
    } catch {}
  };

  const handleStartExport = async () => {
    if (selectedColKeys.length === 0) {
      toast.error('يرجى اختيار عمود واحد على الأقل للتصدير');
      return;
    }

    setOpen(false);
    setIsExporting(true);
    setProgressState({ processed: 0, total: 0, percent: 0 });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await runExport(spec, {
        format,
        locale: headerLocale,
        selectedColumns: selectedColKeys,
        signal: controller.signal,
        onProgress: (p) => {
          setProgressState(p);
        },
      });

      toast.success(t('exportSuccess'));
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      if (errorObj?.code === 'CANCELLED' || controller.signal.aborted) {
        toast.info(t('exportCancelled'));
      } else {
        toast.error(errorObj?.message || t('exportFailed'));
      }
    } finally {
      setIsExporting(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsExporting(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn('gap-1.5', className)}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            <span>{label || t('export')}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-4 space-y-4" align="end">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <FileSpreadsheet className="size-4 text-primary" />
              {t('exportTitle')}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('exportDesc')}
            </p>
          </div>

          {/* Format selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t('format')}</Label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={cn(
                  'flex items-center justify-center p-2 rounded-lg border text-xs font-semibold transition-colors',
                  format === 'xlsx'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background hover:bg-muted/40 text-muted-foreground'
                )}
              >
                Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={cn(
                  'flex items-center justify-center p-2 rounded-lg border text-xs font-semibold transition-colors',
                  format === 'csv'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background hover:bg-muted/40 text-muted-foreground'
                )}
              >
                CSV (.csv)
              </button>
            </div>
          </div>

          {/* Header language toggle */}
          <div className="flex items-center justify-between border-t border-border/40 pt-3">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Globe className="size-3.5 text-muted-foreground" />
              {t('headerLanguage')}
            </Label>
            <div className="inline-flex rounded-md border border-border p-0.5 bg-muted/40">
              <button
                type="button"
                onClick={() => setHeaderLocale('ar')}
                className={cn(
                  'px-2 py-1 text-[11px] font-semibold rounded transition-colors',
                  headerLocale === 'ar'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground'
                )}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => setHeaderLocale('en')}
                className={cn(
                  'px-2 py-1 text-[11px] font-semibold rounded transition-colors',
                  headerLocale === 'en'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground'
                )}
              >
                English
              </button>
            </div>
          </div>

          {/* Columns selection */}
          <div className="space-y-2 border-t border-border/40 pt-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">{t('columns')}</Label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-primary hover:underline"
                >
                  {t('selectAll')}
                </button>
                <span className="text-muted-foreground">·</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-muted-foreground hover:underline"
                >
                  {t('deselectAll')}
                </button>
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2">
              {allColumns.map((col) => {
                const isChecked = selectedColKeys.includes(col.key);
                return (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 text-xs cursor-pointer select-none hover:bg-background/80 p-1 rounded"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleToggleCol(col.key)}
                    />
                    <span className="truncate">{col.header[headerLocale]}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Submit action */}
          <Button
            type="button"
            className="w-full gap-1.5"
            onClick={handleStartExport}
          >
            <Download className="size-3.5" />
            <span>{t('startExport')}</span>
          </Button>
        </PopoverContent>
      </Popover>

      {/* Export progress modal */}
      <Dialog open={isExporting} onOpenChange={(val) => !val && handleCancelExport()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>{t('exporting')}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <Progress
              value={progressState.percent}
              label={t('preparing', {
                processed: progressState.processed.toLocaleString(),
                total: progressState.total.toLocaleString(),
              })}
              onCancel={handleCancelExport}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
