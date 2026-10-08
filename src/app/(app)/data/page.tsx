import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Database } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return {
    title: `${t('data')} · Scope CRM`,
  };
}

export default async function DataPage() {
  const t = await getTranslations('nav');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t('data')}
        </h1>
      </div>

      <EmptyState
        icon={Database}
        title="مركز إدارة واستيراد البيانات"
        description="يمكنك من هنا استيراد ملفات Excel و CSV والنسخ الاحتياطي للنظام واستعادة البيانات."
      />
    </div>
  );
}
