import { supabase } from '@/lib/supabase/client';
import type { ExportSpec } from '../types';
import type { Database } from '@/types/database';

type LeadRow = Database['public']['Tables']['leads']['Row'];
type EventRow = Database['public']['Tables']['lead_events']['Row'];

export function createLeadDetailExportSpec(lead: LeadRow): ExportSpec {
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = lead.name.replace(/[/\\?%*:|"<>]/g, '_').trim();

  return {
    id: `lead_detail_${lead.id}`,
    fileName: `scope-lead_${safeName}_${dateStr}`,
    sheets: [
      {
        name: { ar: 'بيانات العميل', en: 'Lead Profile' },
        columns: [
          { key: 'field', header: { ar: 'الحقل', en: 'Field' }, width: 22, format: 'text' },
          { key: 'value', header: { ar: 'القيمة', en: 'Value' }, width: 40, format: 'text' },
        ],
        fetchPage: async () => {
          const profileRows = [
            { field: 'الاسم / Name', value: lead.name },
            { field: 'الشركة / Company', value: lead.company || '' },
            { field: 'المسمى الوظيفي / Job Title', value: lead.job_title || '' },
            { field: 'إنستجرام / Instagram', value: lead.instagram_handle ? `@${lead.instagram_handle}` : '' },
            { field: 'واتساب / WhatsApp', value: lead.whatsapp_e164 || '' },
            { field: 'المرحلة / Stage', value: lead.stage },
            { field: 'المتابعات المرسلة / Follow-ups Sent', value: String(lead.follow_ups_sent) },
            { field: 'المتابعة القادمة / Next Follow-up', value: lead.next_follow_up_on || '' },
            { field: 'آخر تواصل / Last Contacted', value: lead.last_contacted_at || '' },
            { field: 'تاريخ الاجتماع / Meeting At', value: lead.meeting_at || '' },
            { field: 'سبب الخسارة / Lost Reason', value: lead.lost_reason || '' },
            { field: 'ملاحظات / Notes', value: lead.notes || '' },
            { field: 'المشاكل والتحديات / Problems', value: lead.problems || '' },
            { field: 'تاريخ الإضافة / Created At', value: lead.created_at },
          ];
          return { rows: profileRows, nextCursor: null };
        },
      },
      {
        name: { ar: 'سجل الأحداث', en: 'Timeline Events' },
        columns: [
          { key: 'id', header: { ar: 'المعرف', en: 'ID' }, width: 10, format: 'number' },
          { key: 'type', header: { ar: 'نوع الحدث', en: 'Event Type' }, width: 20, format: 'text' },
          { key: 'from_stage', header: { ar: 'من مرحلة', en: 'From Stage' }, width: 16, format: 'stage' },
          { key: 'to_stage', header: { ar: 'إلى مرحلة', en: 'To Stage' }, width: 16, format: 'stage' },
          { key: 'occurred_at', header: { ar: 'وقت الحدوث', en: 'Occurred At' }, width: 20, format: 'datetime' },
          { key: 'undone_at', header: { ar: 'وقت التراجع', en: 'Undone At' }, width: 20, format: 'datetime' },
        ],
        fetchPage: async (cursor) => {
          let query = supabase
            .from('lead_events')
            .select('*')
            .eq('lead_id', lead.id)
            .order('id', { ascending: false })
            .limit(100);

          if (cursor) {
            query = query.lt('id', cursor as number);
          }

          const { data, error } = await query;
          if (error) throw error;
          const rows = (data || []) as EventRow[];
          const last = rows[rows.length - 1];

          return {
            rows,
            nextCursor: rows.length >= 100 && last ? last.id : null,
          };
        },
      },
    ],
  };
}
