'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export function AuthListener() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        if (pathname !== '/login' && pathname !== '/reset-password') {
          const search = searchParams.toString();
          const current = `${pathname}${search ? `?${search}` : ''}`;
          router.replace(`/login?next=${encodeURIComponent(current)}`);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname, searchParams]);

  return null;
}
