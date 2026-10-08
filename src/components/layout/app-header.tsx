'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { signOutUser } from '@/features/auth/api';

export function AppHeader() {
  const tAuth = useTranslations('auth');
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOutUser();
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  return (
    <header className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 backdrop-blur-md px-4">
      <Link href="/" className="flex items-center gap-2 font-bold text-sm tracking-tight text-foreground">
        <span className="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-black">
          S
        </span>
        <span>Scope CRM</span>
      </Link>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <LanguageToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          aria-label={tAuth('signOut')}
          className="size-8 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
        >
          <LogOut className="size-4 stroke-[1.75]" />
        </Button>
      </div>
    </header>
  );
}
