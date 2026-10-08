import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return {
    title: `${t('leads')} · Scope CRM`,
  };
}

export default async function LeadsPage() {
  const t = await getTranslations('nav');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t('leads')}
        </h1>
      </div>

      <EmptyState
        icon={Users}
        title="لا يوجد عملاء بعد"
        description="ابدأ بإضافة أول عميل محتمل أو استيراد ملف العملاء للبدء في تتبع مراحل المبيعات."
      />
    </div>
  );
}
