'use client';

import { useCallback } from 'react';
import { setTheme } from '@/lib/theme';

export function useTheme() {
  const theme = 'dark' as const;

  const toggleTheme = useCallback(() => {
    // Explicitly enforce dark theme
    setTheme('dark');
  }, []);

  return { theme, setTheme, toggleTheme };
}

