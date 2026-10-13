export type Theme = 'dark' | 'light' | 'system';

export const THEME_COOKIE_NAME = 'theme';
export const THEME_COOKIE_MAX_AGE = 31536000; // 1 year in seconds

export function parseTheme(value?: string | null): Theme {
  void value;
  // System is permanently dark mode
  return 'dark';
}

export function resolveTheme(theme?: Theme): 'dark' {
  void theme;
  // System is permanently dark mode
  return 'dark';
}

export function setTheme(theme?: Theme): void {
  void theme;
  if (typeof document === 'undefined') return;

  // Persist dark preference in cookie
  document.cookie = `${THEME_COOKIE_NAME}=dark; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;

  // Apply resolved dark theme attribute and class to root
  document.documentElement.setAttribute('data-theme', 'dark');
  document.documentElement.classList.add('dark');
}

/**
 * Inline script to prevent theme flashing on initial page load (FOUC).
 * Enforces pure dark theme instantly before paint.
 */
export const themeInitScript = `(function() {
  try {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  } catch(e) {}
})();`;

