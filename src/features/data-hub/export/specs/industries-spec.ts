import { supabase } from '@/lib/supabase/client';
import type { ExportSpec } from '../types';
import type { Database } from '@/types/database';

type IndustryRow = Database['public']['Tables']['industries']['Row'];

export function createIndustriesExportSpec(): ExportSpec<IndustryRow> {
  const dateStr = new Date().toISOString().slice(0, 10);

  return {
    id: 'industries',
    fileName: `scope-industries_${dateStr}`,
    sheets: [
      {
        name: { ar: 'أنشطة الأعمال', en: 'Industries' },
        columns: [
          { key: 'sort_order', header: { ar: 'الترتيب', en: 'Sort Order' }, width: 12, format: 'number' },
          { key: 'label_ar', header: { ar: 'الاسم بالعربية', en: 'Arabic Name' }, width: 22, format: 'text' },
          { key: 'label_en', header: { ar: 'الاسم بالإنجليزية', en: 'English Name' }, width: 22, format: 'text' },
          { key: 'key', header: { ar: 'المفتاح البرمجي', en: 'Key' }, width: 18, format: 'text' },
          {
            key: 'is_active',
            header: { ar: 'الحالة', en: 'Status' },
            width: 14,
            format: 'text',
            getValue: (row) => (row.is_active ? 'نشط / Active' : 'مخفي / Hidden'),
          },
        ],
        fetchPage: async () => {
          const { data, error } = await supabase
            .from('industries')
            .select('*')
            .order('sort_order', { ascending: true });

          if (error) throw error;
          return { rows: (data || []) as IndustryRow[], nextCursor: null };
        },
      },
    ],
  };
}
