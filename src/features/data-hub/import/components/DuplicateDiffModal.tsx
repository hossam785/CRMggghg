'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { ImportRow, ImportDecision } from '../types';

interface DuplicateDiffModalProps {
  row: ImportRow | null;
  jobId: string;
  onClose: () => void;
  onDecisionChange: (rowNo: number, decision: ImportDecision) => void;
}

export function DuplicateDiffModal({
  row,
  jobId,
  onClose,
  onDecisionChange,
}: DuplicateDiffModalProps) {
  const [decision, setDecision] = React.useState<ImportDecision>(() => row?.decision || 'skip');
  const [isSaving, setIsSaving] = React.useState(false);

  const supabase = createClient();
  const matchLeadId = row?.match_lead_id;

  const { data: existingLead, isLoading } = useQuery({
    queryKey: ['lead', matchLeadId],
    queryFn: async () => {
      if (!matchLeadId) return null;
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('id', matchLeadId)
        .single();
      return data;
    },
    enabled: Boolean(matchLeadId),
  });

  if (!row) return null;

  const incoming = (row.data as Record<string, unknown>) || {};

  const handleSaveDecision = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('import_rows')
        .update({ decision })
        .eq('job_id', jobId)
        .eq('row_no', row.row_no);

      if (error) throw error;

      onDecisionChange(row.row_no, decision);
      onClose();
    } catch {
      // Ignored
    } finally {
      setIsSaving(false);
    }
  };

  const getString = (val: unknown): string =>
    typeof val === 'string' || typeof val === 'number' ? String(val) : '';

  const fields = [
    { label: 'الاسم', incoming: getString(incoming.name), existing: existingLead?.name || '' },
    { label: 'إنستجرام', incoming: getString(incoming.instagram_handle), existing: existingLead?.instagram_handle || '' },
    { label: 'واتساب', incoming: getString(incoming.whatsapp_e164), existing: existingLead?.whatsapp_e164 || '' },
    { label: 'الشركة', incoming: getString(incoming.company), existing: existingLead?.company || '' },
    { label: 'المسمى الوظيفي', incoming: getString(incoming.job_title), existing: existingLead?.job_title || '' },
    { label: 'الدولة', incoming: getString(incoming.country_code), existing: existingLead?.country_code || '' },
    { label: 'الملاحظات', incoming: getString(incoming.notes), existing: existingLead?.notes || '' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-bold text-sm text-foreground">
            مقارنة العميل المكرر (الصف #{row.row_no})
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="size-6 animate-spin text-primary mx-auto" />
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-2.5 text-start font-bold text-muted-foreground w-28">الحقل</th>
                    <th className="p-2.5 text-start font-bold text-muted-foreground border-s border-border">
                      العميل الحالي في النظام
                    </th>
                    <th className="p-2.5 text-start font-bold text-primary border-s border-border">
                      القيمة الواردة في الملف
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fields.map((f, i) => (
                    <tr key={i} className="hover:bg-accent/20">
                      <td className="p-2.5 font-semibold text-muted-foreground">{f.label}</td>
                      <td className="p-2.5 text-foreground/80 border-s border-border font-mono truncate max-w-xs">
                        {f.existing || <span className="text-muted-foreground/40 italic">فارغ</span>}
                      </td>
                      <td className="p-2.5 text-foreground border-s border-border font-mono font-bold truncate max-w-xs">
                        {f.incoming || <span className="text-muted-foreground/40 italic">فارغ</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Decision Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-foreground block">
              القرار المطلوب لهذا السجل:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                  decision === 'skip'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-foreground'
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="skip"
                  checked={decision === 'skip'}
                  onChange={() => setDecision('skip')}
                  className="sr-only"
                />
                <span>تخطي وعدم التعديل</span>
              </label>

              <label
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                  decision === 'update'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-foreground'
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="update"
                  checked={decision === 'update'}
                  onChange={() => setDecision('update')}
                  className="sr-only"
                />
                <span>تحديث العميل الحالي</span>
              </label>

              <label
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                  decision === 'import'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-foreground'
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="import"
                  checked={decision === 'import'}
                  onChange={() => setDecision('import')}
                  className="sr-only"
                />
                <span>إضافة كعميل منفصل</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={onClose}>
              إلغاء
            </Button>
            <Button size="sm" onClick={handleSaveDecision} disabled={isSaving}>
              {isSaving ? <Loader2 className="size-4 animate-spin me-1.5" /> : <Check className="size-4 me-1.5" />}
              تأكيد القرار
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
