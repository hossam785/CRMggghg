import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GeneralSettingsCard } from '@/features/settings/components/GeneralSettingsCard';
import { FollowUpIntervalsCard } from '@/features/settings/components/FollowUpIntervalsCard';
import { IndustriesManager } from '@/features/settings/components/IndustriesManager';
import { AccountCard } from '@/features/settings/components/AccountCard';
import { QuickLinksCard } from '@/features/settings/components/QuickLinksCard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return {
    title: `${t('settings')} · Scope CRM`,
  };
}

export default async function SettingsPage() {
  const t = await getTranslations('settings');

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('generalDesc')}
        </p>
      </div>

      <div className="space-y-6">
        {/* General Preferences: Language, Theme, Timezone, Default Country */}
        <GeneralSettingsCard />

        {/* Outreach & Follow-up Intervals */}
        <FollowUpIntervalsCard />

        {/* Industries Management (Reorder, Rename, Hide, Add, Safe Delete) */}
        <IndustriesManager />

        {/* Account & Security: Change Password, Sign out */}
        <AccountCard />

        {/* Quick Links: Data Hub & Trash */}
        <QuickLinksCard />
      </div>
    </div>
  );
}
