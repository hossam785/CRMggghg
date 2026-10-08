'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { setTheme } from '@/lib/theme';

function getThemeSnapshot(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  return (
    (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') ||
    'light'
  );
}

function subscribeTheme(callback: () => void) {
  if (typeof MutationObserver === 'undefined') return () => {};
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'attributes' && m.attributeName === 'data-theme') {
        callback();
      }
    }
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => observer.disconnect();
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    () => 'light'
  );

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [theme]);

  return { theme, setTheme, toggleTheme };
}
