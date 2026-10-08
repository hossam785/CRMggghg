'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSetLocale } from '@/hooks/use-set-locale';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const locale = useLocale();
  const { setLocale, isPending } = useSetLocale();
  const t = useTranslations('a11y');

  const handleToggle = () => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={t('languageToggle')}
      className="gap-1.5 text-xs font-medium"
    >
      <Languages className="size-4" />
      <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
    </Button>
  );
}
