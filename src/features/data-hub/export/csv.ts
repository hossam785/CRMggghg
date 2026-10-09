import { zipSync } from 'fflate';

export interface CsvSheetData {
  name: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

/**
 * Escapes a single CSV value according to RFC 4180.
 */
export function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts a single sheet's headers and rows to a CSV string with UTF-8 BOM and \r\n line endings.
 */
export function sheetToCsvString(sheet: CsvSheetData): string {
  const lines: string[] = [];

  // Header line
  lines.push(sheet.headers.map(escapeCsvValue).join(','));

  // Data rows
  for (const row of sheet.rows) {
    lines.push(row.map(escapeCsvValue).join(','));
  }

  // UTF-8 BOM prefix + CRLF joined lines
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}

/**
 * Converts CSV string to Uint8Array UTF-8 bytes.
 */
export function stringToUtf8Bytes(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Converts multiple sheets into either a single CSV (if 1 sheet) or a ZIP of CSVs (if > 1 sheet).
 */
export function buildCsvOrZip(sheets: CsvSheetData[]): Uint8Array {
  if (sheets.length === 0) {
    return stringToUtf8Bytes('\uFEFF');
  }

  if (sheets.length === 1 && sheets[0]) {
    const csvStr = sheetToCsvString(sheets[0]);
    return stringToUtf8Bytes(csvStr);
  }

  // Multiple sheets -> ZIP archive
  const zipFiles: Record<string, Uint8Array> = {};
  for (const sheet of sheets) {
    const safeName = sheet.name.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'Sheet';
    const csvBytes = stringToUtf8Bytes(sheetToCsvString(sheet));
    zipFiles[`${safeName}.csv`] = csvBytes;
  }

  return zipSync(zipFiles);
}
