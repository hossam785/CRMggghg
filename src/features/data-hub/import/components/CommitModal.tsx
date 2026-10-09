'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Loader2,
  RotateCcw,
  ExternalLink,
  X,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';
import { runCommit, runRollback } from '../run-commit';

interface CommitModalProps {
  jobId: string;
  totalToCommit: number;
  insertCount: number;
  updateCount: number;
  skipCount: number;
  onClose: () => void;
  onComplete: () => void;
}

export function CommitModal({
  jobId,
  totalToCommit,
  insertCount,
  updateCount,
  skipCount,
  onClose,
  onComplete,
}: CommitModalProps) {
  const [isCommitting, setIsCommitting] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [result, setResult] = React.useState<{ inserted: number; updated: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Rollback state
  const [isRollingBack, setIsRollingBack] = React.useState(false);
  const [rolledBackResult, setRolledBackResult] = React.useState<{ deleted: number; restored: number } | null>(null);

  const handleStartCommit = async () => {
    setIsCommitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const res = await runCommit({
        jobId,
        totalToCommit,
        supabase,
        onProgress: (committed, total) => {
          const pct = total > 0 ? Math.round((committed / total) * 100) : 100;
          setProgress(pct);
        },
      });

      setResult({ inserted: res.inserted, updated: res.updated });
      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل اعتماد الاستيراد');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleRollback = async () => {
    if (!confirm('هل أنت متأكد من التراجع عن هذا الاستيراد؟ سيتم حذف العملاء المضافين واستعادة القيم السابقة للمحدثين.')) {
      return;
    }

    setIsRollingBack(true);
    try {
      const supabase = createClient();
      const res = await runRollback(jobId, supabase);
      setRolledBackResult(res);
      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل التراجع عن الاستيراد');
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in-0 zoom-in-95">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-bold text-sm text-foreground">
            {result ? 'اكتمل الاستيراد بنجاح' : 'تأكيد اعتماد واستيراد العملاء'}
          </span>
          {!isCommitting && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-5 text-start">
          {error && (
            <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs">
              {error}
            </div>
          )}

          {/* Initial Confirmation State */}
          {!isCommitting && !result && !rolledBackResult && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                سيتم الآن إدخال البيانات المعتمدة في قاعدة بيانات Scope Mini CRM وفق الخيارات التالية:
              </p>

              <div className="space-y-2 p-3.5 rounded-xl border border-border bg-muted/30 text-xs">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">عملاء جدد ستتم إضافتهم:</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    +{insertCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">عملاء حاليون سيتم تحديث بياناتهم:</span>
                  <span className="font-bold text-purple-600 font-mono">
                    ~{updateCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">صفوف سيتم تخطيها:</span>
                  <span className="font-semibold text-muted-foreground font-mono">
                    {skipCount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  إلغاء
                </Button>
                <Button size="sm" onClick={handleStartCommit} className="font-bold px-5">
                  بدء الاستيراد الفعلي الآن
                </Button>
              </div>
            </div>
          )}

          {/* Running Progress State */}
          {isCommitting && (
            <div className="text-center py-6 space-y-4">
              <Loader2 className="size-10 animate-spin text-primary mx-auto" />
              <div className="space-y-1">
                <div className="text-sm font-bold text-foreground">جارِ استيراد وحفظ العملاء…</div>
                <div className="text-xs text-muted-foreground">يتم الإدخال في دفعات آمنة مع حفظ السجلات</div>
              </div>
              <Progress value={progress} className="h-2 rounded-full" />
              <div className="text-xs font-mono text-muted-foreground">{progress}%</div>
            </div>
          )}

          {/* Success State */}
          {result && !rolledBackResult && (
            <div className="text-center py-4 space-y-5">
              <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <FileCheck className="size-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  تم الاستيراد والاعتماد بنجاح!
                </h3>
                <p className="text-xs text-muted-foreground">
                  تمت إضافة {result.inserted.toLocaleString()} عميل جديد وتحديث {result.updated.toLocaleString()} عميل.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <Button asChild size="sm" className="w-full sm:w-auto font-bold">
                  <Link href={`/leads?import_job_id=${jobId}`}>
                    <ExternalLink className="size-4 me-1.5" />
                    عرض العملاء المستوردين في القائمة
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRollback}
                  disabled={isRollingBack}
                  className="w-full sm:w-auto text-destructive hover:bg-destructive/10"
                >
                  <RotateCcw className="size-4 me-1.5" />
                  {isRollingBack ? 'جارِ التراجع…' : 'التراجع عن هذا الاستيراد (Rollback)'}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground/80">
                * يمكنك التراجع عن هذا الاستيراد في أي وقت خلال 7 أيام من صفحة مركز البيانات.
              </p>
            </div>
          )}

          {/* Rolled Back State */}
          {rolledBackResult && (
            <div className="text-center py-4 space-y-4">
              <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <RotateCcw className="size-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  تم التراجع عن الاستيراد بنجاح
                </h3>
                <p className="text-xs text-muted-foreground">
                  تم حذف {rolledBackResult.deleted.toLocaleString()} عميل مضاف، واستعادة {rolledBackResult.restored.toLocaleString()} عميل لقيمهم السابقة.
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
