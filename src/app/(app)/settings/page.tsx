import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Label } from '@/components/ui/label';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return {
    title: `${t('settings')} · Scope CRM`,
  };
}

export default async function SettingsPage() {
  const t = await getTranslations('nav');
  const tA11y = await getTranslations('a11y');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t('settings')}
        </h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Appearance & Theme Card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {tA11y('themeToggle')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              تبديل المظهر بين الفاتح والداكن
            </p>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Label className="text-sm font-medium">المظهر الحالي</Label>
            <ThemeToggle />
          </div>
        </div>

        {/* Language Card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {tA11y('languageToggle')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              تغيير لغة واجهة النظام
            </p>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Label className="text-sm font-medium">اللغة</Label>
            <LanguageToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
