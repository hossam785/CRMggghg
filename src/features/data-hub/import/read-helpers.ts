// Helpers for reading spreadsheets, encoding detection, delimiter sniffing, header detection, and digit normalization.

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function normalizeDigits(input: string): string {
  let res = input;
  for (let i = 0; i < 10; i++) {
    const arChar = ARABIC_INDIC_DIGITS[i];
    if (arChar) res = res.replaceAll(arChar, String(i));
    const faChar = PERSIAN_DIGITS[i];
    if (faChar) res = res.replaceAll(faChar, String(i));
  }
  return res;
}

export function detectEncoding(bytes: Uint8Array): string {
  // Check UTF-8 BOM
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8';
  }

  // Try decoding UTF-8 strictly
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    decoder.decode(bytes.slice(0, Math.min(bytes.length, 65536)));
    return 'utf-8';
  } catch {
    // If invalid UTF-8 byte sequences detected, likely Windows-1256 for Arabic CSVs
    return 'windows-1256';
  }
}

export function detectDelimiter(sampleText: string): string {
  const lines = sampleText.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 5);
  if (lines.length === 0) return ',';

  const candidates = [',', ';', '\t', '|'];
  const scores: Record<string, number> = { ',': 0, ';': 0, '\t': 0, '|': 0 };

  for (const delim of candidates) {
    const counts = lines.map((line) => line.split(delim).length - 1);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    // Prefer delimiters that appear consistently on multiple lines
    const isConsistent = counts.every((c) => c === counts[0] && c > 0);
    scores[delim] = avg * (isConsistent ? 2.5 : 1);
  }

  let bestDelim = ',';
  let maxScore = -1;
  for (const [delim, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestDelim = delim;
    }
  }

  return maxScore > 0 ? bestDelim : ',';
}

export function detectHeaderRowIndex(rows: unknown[][]): number {
  if (rows.length === 0) return 1;

  let bestIndex = 0;
  let maxScore = -1;

  const inspectCount = Math.min(rows.length, 20);
  for (let i = 0; i < inspectCount; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    // Skip example template row
    if (row.some((cell) => typeof cell === 'string' && cell.trim() === '#example')) {
      continue;
    }

    let score = 0;
    for (const cell of row) {
      if (cell === null || cell === undefined) continue;
      const str = String(cell).trim();
      if (str.length === 0) continue;

      // Header cells are almost always textual, not pure numbers or URLs
      if (Number.isNaN(Number(str))) {
        score += 2;
      } else {
        score += 0.5;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestIndex = i;
    }
  }

  return bestIndex + 1; // 1-indexed
}

export function cleanCellValue(val: unknown): unknown {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return normalizeDigits(trimmed);
  }
  return val;
}
