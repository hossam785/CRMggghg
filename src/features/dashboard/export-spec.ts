import type { ExportSpec, SheetSpec } from '@/features/data-hub/export/types';
import type { RawDashboardStats } from './types';
import { computeDelta } from './types';

interface KpiRow {
  metric: string;
  current: number | string;
  previous: number | string;
  delta: string;
  note: string;
}

interface PipelineRow {
  stage: string;
  count: number;
  percentage: string;
}

export function createDashboardExportSpec(
  stats: RawDashboardStats,
  rangeLabel: string
): ExportSpec {
  const newLeadsDelta = computeDelta(stats.new_leads.cur, stats.new_leads.prev);
  const totalOutreachCur = stats.cur.first_messages + stats.cur.follow_ups;
  const totalOutreachPrev = stats.prev.first_messages + stats.prev.follow_ups;
  const outreachDelta = computeDelta(totalOutreachCur, totalOutreachPrev);
  const repliesDelta = computeDelta(stats.cur.replied, stats.prev.replied);
  const meetingsDelta = computeDelta(stats.cur.meetings, stats.prev.meetings);
  const wonDelta = computeDelta(stats.cur.won, stats.prev.won);

  const kpiRows: KpiRow[] = [
    {
      metric: 'إجمالي العملاء',
      current: stats.total_leads,
      previous: '—',
      delta: '—',
      note: 'إجمالي قاعدة البيانات',
    },
    {
      metric: 'العملاء الجدد',
      current: stats.new_leads.cur,
      previous: stats.new_leads.prev,
      delta: newLeadsDelta.formatted,
      note: `${stats.not_contacted} لم يتم التواصل معهم بعد`,
    },
    {
      metric: 'الرسائل المرسلة',
      current: totalOutreachCur,
      previous: totalOutreachPrev,
      delta: outreachDelta.formatted,
      note: `${stats.cur.first_messages} رسالة أولى · ${stats.cur.follow_ups} متابعة`,
    },
    {
      metric: 'الردود المستلمة',
      current: stats.cur.replied,
      previous: stats.prev.replied,
      delta: repliesDelta.formatted,
      note: totalOutreachCur > 0 ? `معدل الرد ${Math.round((stats.cur.replied / totalOutreachCur) * 100)}%` : '—',
    },
    {
      metric: 'اجتماعات محجوزة',
      current: stats.cur.meetings,
      previous: stats.prev.meetings,
      delta: meetingsDelta.formatted,
      note: 'اجتماعات المبيعات المتفق عليها',
    },
    {
      metric: 'صفقات ناجحة (Won)',
      current: stats.cur.won,
      previous: stats.prev.won,
      delta: wonDelta.formatted,
      note: stats.cur.meetings > 0 ? `نسبة التحويل ${Math.round((stats.cur.won / stats.cur.meetings) * 100)}%` : '—',
    },
  ];

  const STAGE_LABELS: Record<string, string> = {
    new: 'جديد',
    message_sent: 'تم إرسال رسالة',
    follow_up_1: 'متابعة 1',
    follow_up_2: 'متابعة 2',
    follow_up_3: 'متابعة 3',
    replied: 'تم الرد',
    meeting_booked: 'موعد محجوز',
    proposal_sent: 'عرض مرسل',
    won: 'ناجح',
    lost: 'خسارة',
  };

  const pipelineRows: PipelineRow[] = Object.entries(STAGE_LABELS).map(([stageKey, label]) => {
    const count = stats.pipeline[stageKey] || 0;
    const pct = stats.total_leads > 0 ? `${Math.round((count / stats.total_leads) * 100)}%` : '0%';
    return {
      stage: label,
      count,
      percentage: pct,
    };
  });

  const kpisSheet: SheetSpec<KpiRow> = {
    name: { ar: 'المؤشرات الرئيسية', en: 'KPIs Summary' },
    columns: [
      { key: 'metric', header: { ar: 'المؤشر', en: 'Metric' }, width: 22, format: 'text' },
      { key: 'current', header: { ar: 'الفترة الحالية', en: 'Current Period' }, width: 16, format: 'number' },
      { key: 'previous', header: { ar: 'الفترة السابقة', en: 'Previous Period' }, width: 16, format: 'text' },
      { key: 'delta', header: { ar: 'نسبة التغير', en: 'Delta' }, width: 14, format: 'text' },
      { key: 'note', header: { ar: 'ملاحظات', en: 'Notes' }, width: 30, format: 'text' },
    ],
    fetchPage: async () => ({
      rows: kpiRows,
      nextCursor: null,
      totalCount: kpiRows.length,
    }),
  };

  const pipelineSheet: SheetSpec<PipelineRow> = {
    name: { ar: 'توزيع المسار', en: 'Pipeline Breakdown' },
    columns: [
      { key: 'stage', header: { ar: 'المرحلة', en: 'Stage' }, width: 20, format: 'text' },
      { key: 'count', header: { ar: 'عدد العملاء', en: 'Lead Count' }, width: 16, format: 'number' },
      { key: 'percentage', header: { ar: 'النسبة المئوية', en: 'Percentage' }, width: 16, format: 'text' },
    ],
    fetchPage: async () => ({
      rows: pipelineRows,
      nextCursor: null,
      totalCount: pipelineRows.length,
    }),
  };

  return {
    id: 'dashboard_summary',
    fileName: `dashboard_${rangeLabel}_${new Date().toISOString().split('T')[0]}`,
    sheets: [kpisSheet, pipelineSheet] as unknown as SheetSpec<Record<string, unknown>>[],
  };
}
