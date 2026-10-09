'use client';

import * as React from 'react';
import {
  RotateCcw,
  Loader2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import type { Backup, Json } from '@/types/database';

interface RestoreModalProps {
  backup: Backup | null;
  onClose: () => void;
  onRestored: () => void;
}

export function RestoreModal({ backup, onClose, onRestored }: RestoreModalProps) {
  const [mode, setMode] = React.useState<'merge' | 'replace'>('merge');
  const [confirmText, setConfirmText] = React.useState('');
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [result, setResult] = React.useState<{ leads_restored: number; current_deleted: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  if (!backup) return null;

  const handleStartRestore = async () => {
    if (mode === 'replace' && confirmText !== 'استبدال') {
      setError('يرجى كتابة كلمة "استبدال" لتأكيد المسح وإعادة الضبط');
      return;
    }

    setIsRestoring(true);
    setError(null);

    try {
      const supabase = createClient();

      // 1. Download backup file content from storage
      if (!backup.storage_path) {
        throw new Error('مسار ملف النسخة الاحتياطية غير متوفر');
      }

      const { data: fileBlob, error: downloadErr } = await supabase.storage
        .from('backups')
        .download(backup.storage_path);

      if (downloadErr || !fileBlob) {
        throw new Error(`تعذر تنزيل ملف النسخة من التخزين: ${downloadErr?.message}`);
      }

      // 2. Parse workbook using SheetJS
      const XLSX = await import('xlsx');
      const arrayBuffer = await fileBlob.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });

      // 3. Create import job of source 'backup'
      const { data: job, error: jobErr } = await supabase
        .from('import_jobs')
        .insert({
          source: 'backup',
          file_name: backup.storage_path.split('/').pop() || 'backup.xlsx',
          sheet_name: 'leads',
          status: 'staging',
        })
        .select('id')
        .single();

      if (jobErr || !job) {
        throw new Error(`فشل إنشاء مهمة الاسترجاع: ${jobErr?.message}`);
      }

      const jobId = job.id;

      // 4. Stage leads from 'leads' sheet
      const leadsWs = wb.Sheets['leads'];
      if (leadsWs) {
        const rawLeads = XLSX.utils.sheet_to_json(leadsWs) as Record<string, unknown>[];
        const stagedBatch = rawLeads.map((item, idx) => ({
          row_no: idx + 1,
          kind: 'lead',
          raw: item as unknown as Json,
          data: item as unknown as Json,
          status: 'valid',
          issues: [] as Json,
        }));

        if (stagedBatch.length > 0) {
          const { error: stageErr } = await supabase.rpc('stage_import_rows', {
            p_job: jobId,
            p_rows: stagedBatch as unknown as Json,
          });
          if (stageErr) throw stageErr;
        }
      }

      // 5. Stage events from 'events' sheet
      const eventsWs = wb.Sheets['events'];
      if (eventsWs) {
        const rawEvents = XLSX.utils.sheet_to_json(eventsWs) as Record<string, unknown>[];
        const stagedEvents = rawEvents.map((item, idx) => ({
          row_no: 1000000 + idx + 1,
          kind: 'event',
          raw: item as unknown as Json,
          data: item as unknown as Json,
          status: 'valid',
          issues: [] as Json,
        }));

        if (stagedEvents.length > 0) {
          await supabase.rpc('stage_import_rows', {
            p_job: jobId,
            p_rows: stagedEvents as unknown as Json,
          });
        }
      }

      // 6. Stage industries from 'industries' sheet
      const indWs = wb.Sheets['industries'];
      if (indWs) {
        const rawInd = XLSX.utils.sheet_to_json(indWs) as Record<string, unknown>[];
        const stagedInd = rawInd.map((item, idx) => ({
          row_no: 2000000 + idx + 1,
          kind: 'industry',
          raw: item as unknown as Json,
          data: item as unknown as Json,
          status: 'valid',
          issues: [] as Json,
        }));

        if (stagedInd.length > 0) {
          await supabase.rpc('stage_import_rows', {
            p_job: jobId,
            p_rows: stagedInd as unknown as Json,
          });
        }
      }

      // 7. Execute restore_commit RPC
      const { data: restoreData, error: restoreErr } = await supabase.rpc('restore_commit', {
        p_job: jobId,
        p_mode: mode,
      });

      if (restoreErr) throw restoreErr;

      setResult(restoreData as { leads_restored: number; current_deleted: number });
      onRestored();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء استرجاع النسخة الاحتياطية');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in-0 zoom-in-95 text-start">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-bold text-sm text-foreground flex items-center gap-2">
            <RotateCcw className="size-4 text-primary" />
            <span>استرجاع قاعدة البيانات من نسخة احتياطية</span>
          </span>
          {!isRestoring && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs">
              {error}
            </div>
          )}

          {!result && !isRestoring && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-1 text-xs">
                <div className="font-bold text-foreground">النسخة المحددة:</div>
                <div className="text-muted-foreground font-mono">
                  تاريخ: {new Date(backup.created_at).toLocaleString('ar-EG')} · الصيغة: {backup.format.toUpperCase()}
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground block">
                  طريقة الاسترجاع:
                </span>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-background cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="radio"
                    name="mode"
                    value="merge"
                    checked={mode === 'merge'}
                    onChange={() => setMode('merge')}
                    className="mt-0.5"
                  />
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-foreground block">
                      دمج (Merge) - موصى به
                    </span>
                    <span className="text-muted-foreground block leading-relaxed">
                      إضافة السجلات والعملاء المفقودين فقط مع الحفاظ على التعديلات الحالية.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 cursor-pointer hover:border-destructive/60 transition-colors">
                  <input
                    type="radio"
                    name="mode"
                    value="replace"
                    checked={mode === 'replace'}
                    onChange={() => setMode('replace')}
                    className="mt-0.5 text-destructive"
                  />
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-destructive block">
                      استبدال كامل (Replace) ⚠️
                    </span>
                    <span className="text-muted-foreground block leading-relaxed">
                      حذف العملاء الحاليين واستعادة حالة قاعدة البيانات تماماً كما كانت وقت أخذ هذه النسخة.
                    </span>
                  </div>
                </label>
              </div>

              {mode === 'replace' && (
                <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 space-y-2">
                  <label className="text-xs font-bold text-destructive block">
                    اكتب كلمة &quot;استبدال&quot; للتأكيد:
                  </label>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="استبدال"
                    className="text-xs border-destructive/40"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" onClick={onClose}>
                  إلغاء
                </Button>
                <Button
                  size="sm"
                  onClick={handleStartRestore}
                  className="font-bold px-5"
                  variant={mode === 'replace' ? 'danger' : 'primary'}
                >
                  بدء الاسترجاع
                </Button>
              </div>
            </div>
          )}

          {isRestoring && (
            <div className="text-center py-6 space-y-3">
              <Loader2 className="size-8 animate-spin text-primary mx-auto" />
              <div className="text-sm font-bold text-foreground">جارِ استرجاع وتطبيق البيانات…</div>
              <p className="text-xs text-muted-foreground">يتم فحص وتثبيت السجلات، يرجى الانتظار</p>
            </div>
          )}

          {result && (
            <div className="text-center py-4 space-y-4">
              <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="size-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  تم الاسترجاع بنجاح!
                </h3>
                <p className="text-xs text-muted-foreground">
                  تم استعادة {result.leads_restored.toLocaleString()} عميل لقاعدة البيانات.
                </p>
              </div>
              <Button size="sm" onClick={onClose} className="mx-auto">
                إغلاق
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
