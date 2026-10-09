import * as React from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Loader2 } from 'lucide-react';
import { DashboardView } from '@/features/dashboard/components/DashboardView';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return {
    title: `${t('home')} · Scope CRM`,
  };
}

export default async function DashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground text-xs">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span>جارِ تحميل لوحة المؤشرات…</span>
        </div>
      }
    >
      <DashboardView />
    </React.Suspense>
  );
}
