import { supabase } from '@/lib/supabase/client';
import { isDemoMode, demoStore } from '@/lib/demo/demo-store';
import type { ExportSpec } from '../types';
import type { Database } from '@/types/database';

type TrashRow = Database['public']['Tables']['leads']['Row'];

export function createTrashExportSpec(): ExportSpec<TrashRow> {
  const dateStr = new Date().toISOString().slice(0, 10);

  return {
    id: 'trash',
    fileName: `scope-trash_${dateStr}`,
    sheets: [
      {
        name: { ar: 'سلة المحذوفات', en: 'Trash' },
        columns: [
          { key: 'name', header: { ar: 'الاسم', en: 'Name' }, width: 22, format: 'text' },
          { key: 'instagram_handle', header: { ar: 'إنستجرام', en: 'Instagram' }, width: 20, format: 'link' },
          { key: 'whatsapp_e164', header: { ar: 'واتساب', en: 'WhatsApp' }, width: 18, format: 'link' },
          { key: 'stage', header: { ar: 'المرحلة السابقة', en: 'Previous Stage' }, width: 16, format: 'stage' },
          { key: 'deleted_at', header: { ar: 'تاريخ الحذف', en: 'Deleted At' }, width: 20, format: 'datetime' },
          { key: 'created_at', header: { ar: 'تاريخ الإضافة الأصلية', en: 'Original Created At' }, width: 20, format: 'datetime' },
        ],
        fetchPage: async (cursor) => {
          if (isDemoMode()) {
            const trash = demoStore.getLeadsRaw().filter((l) => !!l.deleted_at);
            return { rows: trash as TrashRow[], nextCursor: null };
          }
          let query = supabase
            .from('leads')
            .select('*')
            .not('deleted_at', 'is', null)
            .order('deleted_at', { ascending: false })
            .limit(500);

          if (cursor) {
            query = query.lt('deleted_at', cursor as string);
          }

          const { data, error } = await query;
          if (error) throw error;
          const rows = (data || []) as TrashRow[];
          const last = rows[rows.length - 1];

          return {
            rows,
            nextCursor: rows.length >= 500 && last ? last.deleted_at : null,
          };
        },
      },
    ],
  };
}
