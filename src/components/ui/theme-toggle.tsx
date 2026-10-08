'use client';

import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations('a11y');

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={t('themeToggle')}
      className="size-8"
    >
      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
