import { parseInstagram } from '@/lib/normalize/instagram';
import { normalizeArabicDigits } from '@/lib/normalize/arabic';

/**
 * Prepares and extracts optimized search terms from user input before sending to the search RPC:
 * 1. If it contains 6 or more digits (after converting Arabic numerals) and isn't an explicit IG handle/URL,
 *    extract digits stripped of leading zeros (e.g., "01012345678" -> "1012345678").
 * 2. If it looks like an Instagram profile link or handle without internal spaces, extract the handle.
 * 3. Otherwise, return the raw trimmed string for full-text / trigram normalization on the server.
 */
export function prepareQuery(rawQuery: string | null | undefined): string {
  if (!rawQuery) {
    return '';
  }

  const trimmed = rawQuery.trim();
  if (!trimmed) {
    return '';
  }

  // 1. Phone number check: 6+ digits and not an explicit IG handle/URL
  const isExplicitIg = trimmed.startsWith('@') || /instagram\.com|instagr\.am/i.test(trimmed);
  const asciiDigits = normalizeArabicDigits(trimmed).replace(/\D/g, '');

  if (!isExplicitIg && asciiDigits.length >= 6) {
    const withoutLeadingZeros = asciiDigits.replace(/^0+/, '');
    if (withoutLeadingZeros.length >= 5) {
      return withoutLeadingZeros;
    }
    return asciiDigits;
  }

  // 2. Instagram handle or profile URL (without internal spaces)
  if (!/\s/.test(trimmed)) {
    const igResult = parseInstagram(trimmed);
    if (igResult.ok) {
      return igResult.handle;
    }
  }

  // 3. Fallback: trimmed text
  return trimmed;
}
