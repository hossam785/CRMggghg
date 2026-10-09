'use client';

import * as React from 'react';
import { X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import type { ImportRow, CountryRef, IndustryRef } from '../types';
import type { Json } from '@/types/database';

interface RowEditorModalProps {
  row: ImportRow | null;
  jobId: string;
  countries: CountryRef[];
  industries: IndustryRef[];
  onClose: () => void;
  onSaved: (updatedRow: ImportRow) => void;
}

interface InnerProps {
  row: ImportRow;
  jobId: string;
  countries: CountryRef[];
  industries: IndustryRef[];
  onClose: () => void;
  onSaved: (updatedRow: ImportRow) => void;
}

function RowEditorForm({
  row,
  jobId,
  countries,
  industries,
  onClose,
  onSaved,
}: InnerProps) {
  const [formData, setFormData] = React.useState<Record<string, unknown>>(
    () => (row.data as Record<string, unknown>) || {}
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const getString = (key: string): string => {
    const val = formData[key];
    return typeof val === 'string' ? val : typeof val === 'number' ? String(val) : '';
  };

  const getNumber = (key: string): number | null => {
    const val = formData[key];
    return typeof val === 'number' ? val : null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const name = getString('name').trim();
      if (!name) {
        throw new Error('اسم العميل مطلوب');
      }

      const hasIg = Boolean(getString('instagram_handle').trim());
      const hasWa = Boolean(getString('whatsapp_e164').trim());
      if (!hasIg && !hasWa) {
        throw new Error('يجب توفير وسيلة تواصل واحدة على الأقل (إنستجرام أو واتساب)');
      }

      const supabase = createClient();
      const { data, error: rpcErr } = await supabase.rpc('update_import_row', {
        p_job: jobId,
        p_row_no: row.row_no,
        p_data: formData as unknown as Json,
        p_status: 'valid',
        p_issues: [] as unknown as Json,
      });

      if (rpcErr || !data) {
        throw new Error(rpcErr?.message || 'فشل تحديث الصف');
      }

      onSaved(data as unknown as ImportRow);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in-0 zoom-in-95">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">
              تعديل بيانات الصف رقم #{row.row_no}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-foreground block mb-1">
                اسم العميل ★
              </label>
              <Input
                value={getString('name')}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                حساب إنستجرام
              </label>
              <Input
                value={getString('instagram_handle')}
                onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                placeholder="username"
                dir="ltr"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                رقم واتساب الدولي (E.164)
              </label>
              <Input
                value={getString('whatsapp_e164')}
                onChange={(e) => setFormData({ ...formData, whatsapp_e164: e.target.value })}
                placeholder="+2010..."
                dir="ltr"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                الشركة
              </label>
              <Input
                value={getString('company')}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                المسمى الوظيفي
              </label>
              <Input
                value={getString('job_title')}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                الدولة
              </label>
              <select
                value={getString('country_code')}
                onChange={(e) => setFormData({ ...formData, country_code: e.target.value || null })}
                className="w-full text-xs rounded-xl border border-border bg-background p-2.5 font-medium"
              >
                <option value="">بدون دولة</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name_ar} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                نشاط العمل
              </label>
              <select
                value={getNumber('industry_id') ?? ''}
                onChange={(e) => setFormData({ ...formData, industry_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full text-xs rounded-xl border border-border bg-background p-2.5 font-medium"
              >
                <option value="">بدون نشاط</option>
                {industries.map((ind) => (
                  <option key={ind.id} value={ind.id}>
                    {ind.label_ar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? <Loader2 className="size-4 animate-spin me-1.5" /> : <Check className="size-4 me-1.5" />}
              حفظ وتصحيح الصف
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RowEditorModal(props: RowEditorModalProps) {
  if (!props.row) return null;
  return <RowEditorForm key={props.row.row_no} {...props} row={props.row} />;
}
