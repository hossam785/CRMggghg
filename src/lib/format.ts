const DEFAULT_LOCALE = 'ar';
const DEFAULT_TIMEZONE = 'Africa/Cairo';

function toDate(value: Date | string | number): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export interface FormatNumberOptions extends Intl.NumberFormatOptions {
  locale?: string;
}

/**
 * Formats a number with numberingSystem='latn' (Western Arabic digits).
 */
export function formatNumber(
  value: number,
  options: FormatNumberOptions = {}
): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '—';
  }

  const { locale = DEFAULT_LOCALE, ...intlOptions } = options;

  return new Intl.NumberFormat(locale, {
    numberingSystem: 'latn',
    ...intlOptions,
  }).format(value);
}

export interface FormatDateOptions extends Intl.DateTimeFormatOptions {
  locale?: string;
  timeZone?: string;
}

/**
 * Formats a date using Intl.DateTimeFormat with numberingSystem='latn' and Africa/Cairo default timeZone.
 */
export function formatDate(
  value: Date | string | number,
  options: FormatDateOptions = {}
): string {
  const date = toDate(value);
  if (!date) return '—';

  const {
    locale = DEFAULT_LOCALE,
    timeZone = DEFAULT_TIMEZONE,
    dateStyle = 'medium',
    ...intlOptions
  } = options;

  return new Intl.DateTimeFormat(locale, {
    numberingSystem: 'latn',
    timeZone,
    dateStyle,
    ...intlOptions,
  }).format(date);
}

export interface FormatDateTimeOptions extends Intl.DateTimeFormatOptions {
  locale?: string;
  timeZone?: string;
}

/**
 * Formats date and time using Intl.DateTimeFormat with numberingSystem='latn' and Africa/Cairo default timeZone.
 */
export function formatDateTime(
  value: Date | string | number,
  options: FormatDateTimeOptions = {}
): string {
  const date = toDate(value);
  if (!date) return '—';

  const {
    locale = DEFAULT_LOCALE,
    timeZone = DEFAULT_TIMEZONE,
    dateStyle = 'medium',
    timeStyle = 'short',
    ...intlOptions
  } = options;

  return new Intl.DateTimeFormat(locale, {
    numberingSystem: 'latn',
    timeZone,
    dateStyle,
    timeStyle,
    ...intlOptions,
  }).format(date);
}

export interface FormatRelativeOptions {
  locale?: string;
  baseDate?: Date | string | number;
  style?: 'long' | 'short' | 'narrow';
  numeric?: 'always' | 'auto';
}

/**
 * Formats relative time (e.g., "منذ ساعتين" or "in 2 days") using Intl.RelativeTimeFormat with numberingSystem='latn'.
 */
export function formatRelative(
  value: Date | string | number,
  options: FormatRelativeOptions = {}
): string {
  const targetDate = toDate(value);
  if (!targetDate) return '—';

  const baseDate = options.baseDate ? toDate(options.baseDate) ?? new Date() : new Date();
  const locale = options.locale ?? DEFAULT_LOCALE;

  const diffInSeconds = Math.round((targetDate.getTime() - baseDate.getTime()) / 1000);

  const effectiveLocale = locale.includes('-u-nu-') ? locale : `${locale}-u-nu-latn`;

  const formatter = new Intl.RelativeTimeFormat(effectiveLocale, {
    numeric: options.numeric ?? 'auto',
    style: options.style ?? 'long',
  });

  const absDiff = Math.abs(diffInSeconds);

  if (absDiff < 45) {
    return formatter.format(Math.round(diffInSeconds), 'second');
  }
  if (absDiff < 2700) {
    // < 45 mins
    return formatter.format(Math.round(diffInSeconds / 60), 'minute');
  }
  if (absDiff < 79200) {
    // < 22 hours
    return formatter.format(Math.round(diffInSeconds / 3600), 'hour');
  }
  if (absDiff < 2160000) {
    // < 25 days
    return formatter.format(Math.round(diffInSeconds / 86400), 'day');
  }
  if (absDiff < 28512000) {
    // < 330 days
    return formatter.format(Math.round(diffInSeconds / 2592000), 'month');
  }

  return formatter.format(Math.round(diffInSeconds / 31536000), 'year');
}
