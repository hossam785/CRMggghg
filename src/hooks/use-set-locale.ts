'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { Locale } from '@/i18n/request';

const COOKIE_NAME = 'NEXT_LOCALE';
const ONE_YEAR_IN_SECONDS = 31536000; // 365 * 24 * 60 * 60

export function useSetLocale() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const setLocale = (nextLocale: Locale) => {
    if (typeof document !== 'undefined') {
      document.cookie = `${COOKIE_NAME}=${nextLocale}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`;
    }

    startTransition(() => {
      router.refresh();
    });
  };

  return {
    setLocale,
    isPending,
  };
}
