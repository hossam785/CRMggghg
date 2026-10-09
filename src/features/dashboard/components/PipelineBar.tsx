'use client';

import * as React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import type { LeadStage } from '@/types/database';

interface PipelineBarProps {
  pipeline: Record<string, number>;
  totalLeads: number;
}

const ORDERED_STAGES: { key: LeadStage; labelAr: string; bgClass: string; fgClass: string }[] = [
  { key: 'new', labelAr: 'جديد', bgClass: 'bg-zinc-400 dark:bg-zinc-600', fgClass: 'text-zinc-700' },
  { key: 'message_sent', labelAr: 'تم إرسال رسالة', bgClass: 'bg-sky-500', fgClass: 'text-sky-700' },
  { key: 'follow_up_1', labelAr: 'متابعة 1', bgClass: 'bg-blue-500', fgClass: 'text-blue-700' },
  { key: 'follow_up_2', labelAr: 'متابعة 2', bgClass: 'bg-indigo-500', fgClass: 'text-indigo-700' },
  { key: 'follow_up_3', labelAr: 'متابعة 3', bgClass: 'bg-violet-500', fgClass: 'text-violet-700' },
  { key: 'replied', labelAr: 'تم الرد', bgClass: 'bg-amber-500', fgClass: 'text-amber-700' },
  { key: 'meeting_booked', labelAr: 'موعد محجوز', bgClass: 'bg-purple-500', fgClass: 'text-purple-700' },
  { key: 'proposal_sent', labelAr: 'عرض مرسل', bgClass: 'bg-pink-500', fgClass: 'text-pink-700' },
  { key: 'won', labelAr: 'ناجح', bgClass: 'bg-emerald-500', fgClass: 'text-emerald-700' },
  { key: 'lost', labelAr: 'خسارة', bgClass: 'bg-rose-500', fgClass: 'text-rose-700' },
];

export function PipelineBar({ pipeline, totalLeads }: PipelineBarProps) {
  const activeSegments = ORDERED_STAGES.map((s) => {
    const count = pipeline[s.key] || 0;
    const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
    return { ...s, count, pct };
  }).filter((s) => s.count > 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            توزيع العملاء حسب مراحل المسار (Pipeline)
          </h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground tabular-nums">
          إجمالي المسار: {totalLeads.toLocaleString('ar-EG')} عميل
        </span>
      </div>

      {/* Stacked Progress Bar */}
      <div className="h-4 w-full rounded-full bg-muted/60 overflow-hidden flex shadow-inner">
        {totalLeads === 0 ? (
          <div className="h-full w-full bg-muted text-muted-foreground/40 text-[10px] flex items-center justify-center font-bold">
            لا توجد بيانات حالية
          </div>
        ) : (
          activeSegments.map((seg) => (
            <Link
              key={seg.key}
              href={`/leads?stage=${seg.key}`}
              style={{ width: `${seg.pct}%` }}
              aria-label={`${seg.labelAr}: ${seg.count} عميل (${Math.round(seg.pct)}%)`}
              title={`${seg.labelAr}: ${seg.count} عميل (${Math.round(seg.pct)}%)`}
              className={`h-full ${seg.bgClass} hover:opacity-85 transition-opacity relative group`}
            />
          ))
        )}
      </div>

      {/* Legend Grid */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs">
        {ORDERED_STAGES.map((stage) => {
          const count = pipeline[stage.key] || 0;
          const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;

          return (
            <Link
              key={stage.key}
              href={`/leads?stage=${stage.key}`}
              className="inline-flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-muted/60 transition-colors group"
            >
              <span className={`size-2.5 rounded-full ${stage.bgClass} shrink-0`} />
              <span className="font-medium text-muted-foreground group-hover:text-foreground">
                {stage.labelAr}
              </span>
              <span className="font-bold text-foreground tabular-nums text-[11px] bg-muted/80 px-1.5 py-0.5 rounded-md">
                {count.toLocaleString('ar-EG')}
                {totalLeads > 0 && <span className="text-muted-foreground text-[10px] ms-1">({pct}%)</span>}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
