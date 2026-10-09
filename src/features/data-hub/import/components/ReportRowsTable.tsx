'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Edit2,
  GitCompare,
  AlertCircle,
  CheckCircle2,
  Copy,
  Database,
  XCircle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { ImportRow, ImportRowStatus, ImportDecision, CountryRef, IndustryRef } from '../types';
import { RowEditorModal } from './RowEditorModal';
import { DuplicateDiffModal } from './DuplicateDiffModal';

interface ReportRowsTableProps {
  jobId: string;
  statusFilter: ImportRowStatus | 'all';
  countries: CountryRef[];
  industries: IndustryRef[];
  onRowUpdated: () => void;
}

const PAGE_SIZE = 50;

export function ReportRowsTable({
  jobId,
  statusFilter,
  countries,
  industries,
  onRowUpdated,
}: ReportRowsTableProps) {
  const [page, setPage] = React.useState(0);
  const [prevFilter, setPrevFilter] = React.useState(statusFilter);
  if (statusFilter !== prevFilter) {
    setPrevFilter(statusFilter);
    setPage(0);
  }
  const [editingRow, setEditingRow] = React.useState<ImportRow | null>(null);
  const [comparingRow, setComparingRow] = React.useState<ImportRow | null>(null);

  const supabase = createClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['import_rows', jobId, statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('import_rows')
        .select('*', { count: 'exact' })
        .eq('job_id', jobId)
        .order('row_no', { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: rows, count, error } = await query;
      if (error) throw error;
      return {
        rows: (rows || []) as unknown as ImportRow[],
        total: count || 0,
      };
    },
  });

  const rows = data?.rows || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleDecisionChange = async (rowNo: number, newDecision: ImportDecision) => {
    await supabase
      .from('import_rows')
      .update({ decision: newDecision })
      .eq('job_id', jobId)
      .eq('row_no', rowNo);

    refetch();
    onRowUpdated();
  };

  const getStatusBadge = (status: ImportRowStatus) => {
    switch (status) {
      case 'valid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="size-3" />
            <span>صالحة</span>
          </span>
        );
      case 'incomplete':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">
            <AlertCircle className="size-3" />
            <span>ناقصة</span>
          </span>
        );
      case 'duplicate_db':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600">
            <Database className="size-3" />
            <span>مكرر بالنظام</span>
          </span>
        );
      case 'duplicate_file':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600">
            <Copy className="size-3" />
            <span>مكرر بالملف</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600">
            <XCircle className="size-3" />
            <span>خطأ</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* Table Container */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="p-3 text-start font-bold text-muted-foreground w-14">#</th>
                <th className="p-3 text-start font-bold text-foreground">الاسم</th>
                <th className="p-3 text-start font-bold text-foreground">إنستجرام / واتساب</th>
                <th className="p-3 text-start font-bold text-foreground">الشركة والنشاط</th>
                <th className="p-3 text-start font-bold text-foreground">الحالة</th>
                <th className="p-3 text-start font-bold text-foreground">القرار</th>
                <th className="p-3 text-end font-bold text-muted-foreground w-28">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    جارِ تحميل صفوف التقرير…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    لا توجد صفوف تطابق هذا التصنيف
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const d = (row.data as Record<string, string | number | boolean | null>) || {};
                  const issues = row.issues || [];
                  const isDupDb = row.status === 'duplicate_db';

                  return (
                    <tr key={row.row_no} className="hover:bg-accent/20 transition-colors">
                      <td className="p-3 font-mono text-muted-foreground font-semibold">
                        {row.row_no}
                      </td>

                      <td className="p-3 font-bold text-foreground">
                        <div>{d.name || <span className="text-destructive">اسم مفقود</span>}</div>
                        {d.job_title && (
                          <div className="text-[11px] text-muted-foreground font-normal">
                            {d.job_title}
                          </div>
                        )}
                      </td>

                      <td className="p-3 font-mono text-[11px]">
                        {d.instagram_handle && (
                          <div className="text-primary truncate max-w-[140px]">
                            @{d.instagram_handle}
                          </div>
                        )}
                        {d.whatsapp_e164 && (
                          <div className="text-emerald-600 truncate max-w-[140px]" dir="ltr">
                            {d.whatsapp_e164}
                          </div>
                        )}
                        {!d.instagram_handle && !d.whatsapp_e164 && (
                          <span className="text-destructive font-sans">لا توجد وسيلة تواصل</span>
                        )}
                      </td>

                      <td className="p-3 text-muted-foreground">
                        <div>{d.company || '—'}</div>
                        {d.country_code && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] bg-muted font-bold">
                            {d.country_code}
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="space-y-1">
                          {getStatusBadge(row.status)}
                          {issues.length > 0 && (
                            <div className="text-[10px] text-destructive truncate max-w-xs">
                              {issues.map((i: { message?: string; code: string }) => i.message || i.code).join(' · ')}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        <select
                          value={row.decision || 'skip'}
                          onChange={(e) =>
                            handleDecisionChange(row.row_no, e.target.value as ImportDecision)
                          }
                          className="text-[11px] font-semibold rounded-lg border border-border bg-background p-1.5"
                        >
                          <option value="import">استيراد</option>
                          <option value="update">تحديث الموجود</option>
                          <option value="skip">تخطي</option>
                        </select>
                      </td>

                      <td className="p-3 text-end space-x-1 space-x-reverse">
                        {isDupDb && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-purple-600 hover:bg-purple-500/10"
                            onClick={() => setComparingRow(row)}
                            title="مقارنة مع العميل الحالي"
                          >
                            <GitCompare className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:bg-muted"
                          onClick={() => setEditingRow(row)}
                          title="تعديل هذا الصف"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              صفحة {page + 1} من {totalPages} (إجمالي {total.toLocaleString()} صف)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronRight className="size-4" />
                <span>السابق</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <span>التالي</span>
                <ChevronLeft className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Row Editor Modal */}
      {editingRow && (
        <RowEditorModal
          row={editingRow}
          jobId={jobId}
          countries={countries}
          industries={industries}
          onClose={() => setEditingRow(null)}
          onSaved={() => {
            refetch();
            onRowUpdated();
          }}
        />
      )}

      {/* Duplicate Diff Modal */}
      {comparingRow && (
        <DuplicateDiffModal
          row={comparingRow}
          jobId={jobId}
          onClose={() => setComparingRow(null)}
          onDecisionChange={() => {
            refetch();
            onRowUpdated();
          }}
        />
      )}
    </div>
  );
}
