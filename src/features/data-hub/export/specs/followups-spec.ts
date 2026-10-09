import { supabase } from '@/lib/supabase/client';
import { isDemoMode, demoStore } from '@/lib/demo/demo-store';
import type { ExportSpec, ColumnDef } from '../types';
import type { Database } from '@/types/database';

type QueueRow = Database['public']['Functions']['follow_up_queue']['Returns'][number];

const FOLLOWUP_COLUMNS: ColumnDef<QueueRow>[] = [
  {
    key: 'name',
    header: { ar: 'الاسم', en: 'Name' },
    width: 22,
    format: 'text',
  },
  {
    key: 'instagram_handle',
    header: { ar: 'إنستجرام', en: 'Instagram' },
    width: 20,
    format: 'link',
  },
  {
    key: 'whatsapp_e164',
    header: { ar: 'واتساب', en: 'WhatsApp' },
    width: 18,
    format: 'link',
  },
  {
    key: 'days_overdue',
    header: { ar: 'أيام التأخير', en: 'Days Overdue' },
    width: 14,
    format: 'number',
  },
  {
    key: 'stage',
    header: { ar: 'المرحلة', en: 'Stage' },
    width: 16,
    format: 'stage',
  },
  {
    key: 'next_follow_up_on',
    header: { ar: 'الموعد المجدول', en: 'Scheduled Date' },
    width: 16,
    format: 'date',
  },
  {
    key: 'last_contacted_at',
    header: { ar: 'آخر تواصل', en: 'Last Contacted' },
    width: 18,
    format: 'datetime',
  },
  {
    key: 'reminder_note',
    header: { ar: 'ملاحظة التذكير', en: 'Reminder Note' },
    width: 28,
    format: 'text',
  },
  {
    key: 'meeting_at',
    header: { ar: 'موعد الاجتماع', en: 'Meeting Time' },
    width: 18,
    format: 'datetime',
  },
];

export function createFollowUpsExportSpec(): ExportSpec<QueueRow> {
  const dateStr = new Date().toISOString().slice(0, 10);

  // Helper to fetch bucket rows
  const fetchBucket = async (bucket: string) => {
    if (isDemoMode()) {
      const all = demoStore.getFollowUpQueue();
      return (all as QueueRow[]).filter((r) => r.bucket === bucket);
    }
    const { data, error } = await supabase.rpc('follow_up_queue', {
      p_waiting_limit: 500,
    });
    if (error) throw error;
    const all = (data || []) as QueueRow[];
    return all.filter((r) => r.bucket === bucket);
  };

  return {
    id: 'follow_ups',
    fileName: `scope-followups_${dateStr}`,
    sheets: [
      {
        name: { ar: 'مستحقة FU1', en: 'Due FU1' },
        columns: FOLLOWUP_COLUMNS,
        fetchPage: async () => {
          const rows = await fetchBucket('due_fu1');
          return { rows, nextCursor: null };
        },
      },
      {
        name: { ar: 'مستحقة FU2', en: 'Due FU2' },
        columns: FOLLOWUP_COLUMNS,
        fetchPage: async () => {
          const rows = await fetchBucket('due_fu2');
          return { rows, nextCursor: null };
        },
      },
      {
        name: { ar: 'مستحقة FU3', en: 'Due FU3' },
        columns: FOLLOWUP_COLUMNS,
        fetchPage: async () => {
          const rows = await fetchBucket('due_fu3');
          return { rows, nextCursor: null };
        },
      },
      {
        name: { ar: 'تذكيرات اليوم', en: 'Reminders' },
        columns: FOLLOWUP_COLUMNS,
        fetchPage: async () => {
          const rows = await fetchBucket('reminder');
          return { rows, nextCursor: null };
        },
      },
      {
        name: { ar: 'مواعيد اليوم', en: 'Meetings Today' },
        columns: FOLLOWUP_COLUMNS,
        fetchPage: async () => {
          const rows = await fetchBucket('meeting_today');
          return { rows, nextCursor: null };
        },
      },
      {
        name: { ar: 'لم يردوا (خلصت 3)', en: 'Exhausted' },
        columns: FOLLOWUP_COLUMNS,
        fetchPage: async () => {
          const rows = await fetchBucket('exhausted');
          return { rows, nextCursor: null };
        },
      },
      {
        name: { ar: 'في الانتظار', en: 'Waiting' },
        columns: FOLLOWUP_COLUMNS,
        fetchPage: async () => {
          const rows = await fetchBucket('waiting');
          return { rows, nextCursor: null };
        },
      },
    ],
  };
}
