'use client';

import * as React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Copy, Database, Users } from 'lucide-react';
import type { ImportRowStatus } from '@/types/database';

interface ReportSummaryCardsProps {
  counts: Record<string, number>;
  totalRows: number;
  activeFilter: ImportRowStatus | 'all';
  onFilterChange: (filter: ImportRowStatus | 'all') => void;
}

export function ReportSummaryCards({
  counts,
  totalRows,
  activeFilter,
  onFilterChange,
}: ReportSummaryCardsProps) {
  const valid = counts.valid || 0;
  const incomplete = counts.incomplete || 0;
  const error = counts.error || 0;
  const duplicateDb = counts.duplicate_db || 0;
  const duplicateFile = counts.duplicate_file || 0;

  const cards = [
    {
      id: 'all' as const,
      label: 'إجمالي الصفوف',
      count: totalRows,
      color: 'text-foreground',
      bg: 'bg-card',
      border: 'border-border',
      icon: Users,
    },
    {
      id: 'valid' as const,
      label: 'مكتملة وصالحة',
      count: valid,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/20',
      icon: CheckCircle2,
    },
    {
      id: 'incomplete' as const,
      label: 'بيانات غير مكتملة',
      count: incomplete,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/20',
      icon: AlertTriangle,
    },
    {
      id: 'duplicate_db' as const,
      label: 'مكرر في النظام',
      count: duplicateDb,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/5',
      border: 'border-purple-500/20',
      icon: Database,
    },
    {
      id: 'duplicate_file' as const,
      label: 'مكرر داخل الملف',
      count: duplicateFile,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-500/5',
      border: 'border-sky-500/20',
      icon: Copy,
    },
    {
      id: 'error' as const,
      label: 'أخطاء تمنع الاستيراد',
      count: error,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/5',
      border: 'border-rose-500/20',
      icon: XCircle,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        const isSelected = activeFilter === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onFilterChange(c.id)}
            className={`p-3.5 rounded-2xl border text-start transition-all ${c.bg} ${
              isSelected
                ? 'ring-2 ring-primary border-primary shadow-sm'
                : `${c.border} hover:border-primary/50`
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-muted-foreground truncate">
                {c.label}
              </span>
              <Icon className={`size-4 ${c.color} shrink-0`} />
            </div>
            <div className={`text-xl font-black ${c.color}`}>
              {c.count.toLocaleString()}
            </div>
          </button>
        );
      })}
    </div>
  );
}
