import { supabase } from '@/lib/supabase/client';
import type { ExportSpec, ColumnDef } from '../types';
import type { Database } from '@/types/database';

type ExportLeadRow = Database['public']['Functions']['export_leads']['Returns'][number];

const LEADS_COLUMNS: ColumnDef<ExportLeadRow>[] = [
  {
    key: 'name',
    header: { ar: 'الاسم', en: 'Name' },
    width: 20,
    format: 'text',
  },
  {
    key: 'company',
    header: { ar: 'الشركة', en: 'Company' },
    width: 18,
    format: 'text',
  },
  {
    key: 'job_title',
    header: { ar: 'المسمى الوظيفي', en: 'Job Title' },
    width: 18,
    format: 'text',
  },
  {
    key: 'instagram_handle',
    header: { ar: 'إنستجرام', en: 'Instagram' },
    width: 22,
    format: 'link',
  },
  {
    key: 'whatsapp_e164',
    header: { ar: 'واتساب', en: 'WhatsApp' },
    width: 18,
    format: 'link',
  },
  {
    key: 'country_name_ar',
    header: { ar: 'الدولة', en: 'Country' },
    width: 15,
    format: 'text',
    getValue: (row) => row.country_name_ar || row.country_code || '',
  },
  {
    key: 'industry_name_ar',
    header: { ar: 'النشاط', en: 'Industry' },
    width: 16,
    format: 'text',
    getValue: (row) => row.industry_name_ar || '',
  },
  {
    key: 'stage',
    header: { ar: 'المرحلة', en: 'Stage' },
    width: 16,
    format: 'stage',
  },
  {
    key: 'follow_ups_sent',
    header: { ar: 'المتابعات المرسلة', en: 'Follow-ups Sent' },
    width: 14,
    format: 'number',
  },
  {
    key: 'next_follow_up_on',
    header: { ar: 'المتابعة القادمة', en: 'Next Follow-up' },
    width: 15,
    format: 'date',
  },
  {
    key: 'last_contacted_at',
    header: { ar: 'آخر تواصل', en: 'Last Contacted' },
    width: 18,
    format: 'datetime',
  },
  {
    key: 'has_content',
    header: { ar: 'لديه محتوى', en: 'Has Content' },
    width: 12,
    format: 'text',
    getValue: (row) =>
      row.has_content === true ? 'نعم / Yes' : row.has_content === false ? 'لا / No' : '',
  },
  {
    key: 'appears_in_content',
    header: { ar: 'يظهر في المحتوى', en: 'Appears in Content' },
    width: 14,
    format: 'text',
    getValue: (row) =>
      row.appears_in_content === true ? 'نعم / Yes' : row.appears_in_content === false ? 'لا / No' : '',
  },
  {
    key: 'has_videographer',
    header: { ar: 'لديه مصور', en: 'Has Videographer' },
    width: 14,
    format: 'text',
    getValue: (row) =>
      row.has_videographer === 'yes'
        ? 'نعم / Yes'
        : row.has_videographer === 'no'
          ? 'لا / No'
          : 'غير محدد / Unknown',
  },
  {
    key: 'notes',
    header: { ar: 'ملاحظات', en: 'Notes' },
    width: 30,
    format: 'text',
  },
  {
    key: 'problems',
    header: { ar: 'المشاكل والتحديات', en: 'Problems' },
    width: 30,
    format: 'text',
  },
  {
    key: 'created_at',
    header: { ar: 'تاريخ الإضافة', en: 'Created At' },
    width: 18,
    format: 'datetime',
  },
];

export interface LeadsExportFilterArgs {
  query?: string | null;
  stages?: Database['public']['Enums']['lead_stage'][] | null;
  industries?: number[] | null;
  countries?: string[] | null;
  filters?: Record<string, unknown> | null;
}

export function createLeadsExportSpec(
  filterArgs: LeadsExportFilterArgs = {}
): ExportSpec<ExportLeadRow> {
  const dateStr = new Date().toISOString().slice(0, 10);
  const isFiltered = !!(
    filterArgs.query ||
    (filterArgs.stages && filterArgs.stages.length > 0) ||
    (filterArgs.industries && filterArgs.industries.length > 0)
  );

  return {
    id: 'leads',
    fileName: `scope-leads_${dateStr}${isFiltered ? '_filtered' : ''}`,
    sheets: [
      {
        name: { ar: 'العملاء', en: 'Leads' },
        columns: LEADS_COLUMNS,
        fetchPage: async (cursor) => {
          const { data, error } = await supabase.rpc('export_leads', {
            p_query: filterArgs.query ?? null,
            p_stages: filterArgs.stages ?? null,
            p_industries: filterArgs.industries ?? null,
            p_countries: filterArgs.countries ?? null,
            p_filters: (filterArgs.filters as Database['public']['Tables']['leads']['Insert']) ?? null,
            p_cursor: (cursor as string) ?? null,
            p_limit: 2000,
          });

          if (error) throw error;
          const rows = (data || []) as ExportLeadRow[];
          const lastRow = rows[rows.length - 1];
          const nextCursor = rows.length >= 2000 && lastRow ? lastRow.id : null;

          return {
            rows,
            nextCursor,
          };
        },
      },
    ],
  };
}
