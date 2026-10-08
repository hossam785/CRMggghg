import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LayoutDashboard } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return {
    title: `${t('home')} · Scope CRM`,
  };
}

export default async function DashboardPage() {
  const t = await getTranslations('nav');
  const tCommon = await getTranslations('common');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t('home')}
        </h1>
      </div>

      <EmptyState
        icon={LayoutDashboard}
        title={tCommon('empty')}
        description="ستظهر مؤشرات الأداء والتحليلات فور تسجيل وإدارة العملاء المحتملين والصفقات."
      />
    </div>
  );
}
