import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Clock } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return {
    title: `${t('followUps')} · Scope CRM`,
  };
}

export default async function FollowUpsPage() {
  const t = await getTranslations('nav');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t('followUps')}
        </h1>
      </div>

      <EmptyState
        icon={Clock}
        title="لا توجد متابعات مستحقة اليوم"
        description="رائع! جميع المتابعات منجزة بالكامل. ستظهر أي مواعيد متابعة مستحقة تلقائياً هنا."
      />
    </div>
  );
}
