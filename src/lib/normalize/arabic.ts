const ARABIC_INDIC_DIGITS_MAP: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

const ARABIC_LETTERS_MAP: Record<string, string> = {
  'أ': 'ا',
  'إ': 'ا',
  'آ': 'ا',
  'ٱ': 'ا',
  'ى': 'ي',
  'ة': 'ه',
  ...ARABIC_INDIC_DIGITS_MAP,
};

const ARABIC_TRANSLATE_REGEX = /[أإآٱىة٠١٢٣٤٥٦٧٨٩]/g;
const ARABIC_DIACRITICS_REGEX = /[\u064B-\u065F\u0670\u0640]/g;
const LATIN_DIACRITICS_REGEX = /[\u0300-\u036f]/g;

/**
 * Converts Eastern Arabic numerals (٠-٩) to standard ASCII digits (0-9).
 */
export function normalizeArabicDigits(input: string): string {
  if (!input) return '';
  return input.replace(/[٠-٩]/g, (char) => ARABIC_INDIC_DIGITS_MAP[char] ?? char);
}

/**
 * Client-side mirror of the PostgreSQL `normalize_search` function.
 * Normalizes Arabic letters (alifs, taa marbuta, alif maqsura), removes diacritics (tashkeel),
 * strips tatweel/kashida, converts digits, strips Latin accents, and lowercases.
 *
 * Edge cases:
 * - 'أحمـــد' -> 'احمد'
 * - 'مُصطفى' -> 'مصطفي'
 * - '٠١٠' -> '010'
 * - 'Dr. Rémy' -> 'dr. remy'
 * - null / undefined -> ''
 */
export function normalizeSearch(t: string | null | undefined): string {
  if (!t) return '';

  // 1. Unaccent Latin characters
  let s = t.normalize('NFD').replace(LATIN_DIACRITICS_REGEX, '');

  // 2. Translate Arabic characters and digits
  s = s.replace(ARABIC_TRANSLATE_REGEX, (char) => ARABIC_LETTERS_MAP[char] ?? char);

  // 3. Remove Arabic diacritics (tashkeel), dagger alif, and tatweel
  s = s.replace(ARABIC_DIACRITICS_REGEX, '');

  // 4. Lowercase
  return s.toLowerCase();
}
