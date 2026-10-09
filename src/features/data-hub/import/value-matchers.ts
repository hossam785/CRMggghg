import type { LeadStage, TriState } from '@/types/database';
import type { CountryRef, IndustryRef } from './types';

// Arabic text normalizer for matching
export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove arabic tashkeel
    .replace(/[-_.,/\\()#*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const del = (prev[j] ?? 0) + 1;
      const ins = (curr[j - 1] ?? 0) + 1;
      const sub = (prev[j - 1] ?? 0) + cost;
      curr[j] = Math.min(del, ins, sub);
    }
    const temp = prev;
    prev = curr;
    curr = temp;
  }
  return prev[n] ?? 0;
}

export function matchTriState(val: unknown): TriState | null {
  if (val === null || val === undefined) return null;
  const norm = normalizeText(String(val));
  if (!norm) return null;

  if (['نعم', 'ايوه', 'ايوة', 'اه', 'yes', 'y', 'true', '1', '✓', '✔', 'صح'].includes(norm)) {
    return 'yes';
  }
  if (['لا', 'كلا', 'no', 'n', 'false', '0', '✗', '✘', 'غلط'].includes(norm)) {
    return 'no';
  }
  if (['غير معروف', 'غير محدد', 'unknown', 'maybe', '?', '؟'].includes(norm)) {
    return 'unknown';
  }
  return null;
}

export const STAGE_SYNONYMS: Record<LeadStage, string[]> = {
  new: ['new', 'جديد', 'عميل جديد', 'مضاف حديثا', 'قيد الانتظار'],
  message_sent: ['message_sent', 'message sent', 'تمت المراسلة', 'تم الارسال', 'رسالة اولي', 'اول رسالة', 'تم التواصل'],
  follow_up_1: ['follow_up_1', 'follow up 1', 'fu1', 'متابعة 1', 'متابعة اولي', 'المتابعة الاولي'],
  follow_up_2: ['follow_up_2', 'follow up 2', 'fu2', 'متابعة 2', 'متابعة ثانية', 'المتابعة الثانية'],
  follow_up_3: ['follow_up_3', 'follow up 3', 'fu3', 'متابعة 3', 'متابعة ثالثة', 'المتابعة الثالثة'],
  replied: ['replied', 'reply', 'تم الرد', 'رد', 'جاوب', 'مهتم', 'تفاعل'],
  meeting_booked: ['meeting_booked', 'meeting booked', 'تم حجز اجتماع', 'اجتماع', 'ميتنج', 'حجز ميتنج', 'موعد'],
  proposal_sent: ['proposal_sent', 'proposal sent', 'تم ارسال العرض', 'عرض سعر', 'بروبوزال', 'عرض', 'ارسال عرض'],
  won: ['won', 'تم التعاقد', 'كسب', 'عميل حالي', 'تعاقد', 'تم الاتفاق', 'ناجح', 'مغلق رابح'],
  lost: ['lost', 'خسارة', 'لم يتم', 'غير مهتم', 'مرفوض', 'خسران', 'ملغي', 'مغلق خاسر'],
};

export function matchStage(val: unknown): LeadStage | null {
  if (val === null || val === undefined) return null;
  const norm = normalizeText(String(val));
  if (!norm) return null;

  for (const [stage, synonyms] of Object.entries(STAGE_SYNONYMS) as [LeadStage, string[]][]) {
    for (const syn of synonyms) {
      const normSyn = normalizeText(syn);
      if (norm === normSyn || norm.startsWith(normSyn) || normSyn.startsWith(norm)) {
        return stage;
      }
    }
  }
  return null;
}

export function matchCountry(val: unknown, countries: CountryRef[]): string | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (!str) return null;

  // Direct ISO-2 match
  const upper = str.toUpperCase();
  const directMatch = countries.find((c) => c.code.toUpperCase() === upper);
  if (directMatch) return directMatch.code;

  const norm = normalizeText(str);
  for (const c of countries) {
    if (normalizeText(c.name_ar) === norm || normalizeText(c.name_en) === norm) {
      return c.code;
    }
  }

  // Substring or Levenshtein
  for (const c of countries) {
    const nAr = normalizeText(c.name_ar);
    const nEn = normalizeText(c.name_en);
    if (norm.includes(nAr) || nAr.includes(norm) || norm.includes(nEn) || nEn.includes(norm)) {
      return c.code;
    }
    if (levenshteinDistance(norm, nAr) <= 1 || levenshteinDistance(norm, nEn) <= 1) {
      return c.code;
    }
  }

  return null;
}

export function matchIndustry(val: unknown, industries: IndustryRef[]): number | null {
  if (val === null || val === undefined) return null;
  const norm = normalizeText(String(val));
  if (!norm) return null;

  // Exact match on label or key
  for (const ind of industries) {
    if (ind.key.toLowerCase() === norm) return ind.id;
    if (normalizeText(ind.label_ar) === norm || normalizeText(ind.label_en) === norm) {
      return ind.id;
    }
  }

  // Substring match
  for (const ind of industries) {
    const nAr = normalizeText(ind.label_ar);
    const nEn = normalizeText(ind.label_en);
    if (norm.includes(nAr) || nAr.includes(norm) || norm.includes(nEn) || nEn.includes(norm)) {
      return ind.id;
    }
  }

  // Levenshtein fuzzy match
  for (const ind of industries) {
    const nAr = normalizeText(ind.label_ar);
    const nEn = normalizeText(ind.label_en);
    if (levenshteinDistance(norm, nAr) <= 2 || levenshteinDistance(norm, nEn) <= 2) {
      return ind.id;
    }
  }

  return null;
}
