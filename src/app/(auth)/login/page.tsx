import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/features/auth/components/login-form';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return {
    title: `${t('title')} · Scope CRM`,
    description: t('subtitle'),
  };
}

export default async function LoginPage() {
  const t = await getTranslations('auth');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      {/* Top Bar with Language and Theme Switches */}
      <div className="absolute top-4 end-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex items-center justify-center rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
            Scope CRM
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
