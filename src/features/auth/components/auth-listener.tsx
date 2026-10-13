'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { broadcastAuthEvent, subscribeAuthBroadcast } from '@/lib/auth-broadcast';

export function AuthListener() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Listen for Supabase client auth events within this tab
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        broadcastAuthEvent({ type: 'SIGNED_OUT' });
        if (pathname !== '/login') {
          const search = searchParams.toString();
          const current = `${pathname}${search ? `?${search}` : ''}`;
          router.replace(`/login?next=${encodeURIComponent(current)}`);
        }
      } else if (event === 'SIGNED_IN') {
        broadcastAuthEvent({ type: 'SIGNED_IN' });
        if (pathname === '/login') {
          router.replace('/');
          router.refresh();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname, searchParams]);

  // 2. Cross-tab synchronization (BroadcastChannel / Storage Events)
  useEffect(() => {
    const unsubscribe = subscribeAuthBroadcast((event) => {
      if (event.type === 'SIGNED_OUT') {
        if (pathname !== '/login') {
          const search = searchParams.toString();
          const current = `${pathname}${search ? `?${search}` : ''}`;
          router.replace(`/login?next=${encodeURIComponent(current)}&reason=multi_tab_signout`);
          router.refresh();
        }
      } else if (event.type === 'SIGNED_IN') {
        if (pathname === '/login') {
          router.replace('/');
          router.refresh();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router, pathname, searchParams]);

  return null;
}
