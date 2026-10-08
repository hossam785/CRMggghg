export type Theme = 'system' | 'light' | 'dark';

export const THEME_COOKIE_NAME = 'theme';
export const THEME_COOKIE_MAX_AGE = 31536000; // 1 year in seconds

export function parseTheme(value: string | undefined | null): Theme {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }
  return 'system';
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') {
    return theme;
  }
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function setTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;

  // Persist preference in cookie
  document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(
    theme
  )}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;

  // Apply resolved theme attribute to root
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute('data-theme', resolved);
}

/**
 * Inline script to prevent theme flashing on initial page load (FOUC).
 * Reads cookie or system preference before the DOM renders.
 */
export const themeInitScript = `(function() {
  try {
    var match = document.cookie.match(/(?:^|; )theme=([^;]*)/);
    var t = match ? decodeURIComponent(match[1]) : 'system';
    var r = t;
    if (t === 'system') {
      r = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', r);
  } catch(e) {}
})();`;
