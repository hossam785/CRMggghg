import * as Comlink from 'comlink';
import * as XLSX from 'xlsx';
import { parsePhoneNumberWithError, type CountryCode } from 'libphonenumber-js';
import { cleanCellValue, detectDelimiter, detectEncoding, detectHeaderRowIndex } from './read-helpers';
import { autoMapColumns } from './auto-map';
import { matchCountry, matchIndustry, matchStage, matchTriState } from './value-matchers';
import type {
  CountryRef,
  ImportCounts,
  ImportIssue,
  ImportWorkerApi,
  IndustryRef,
  Mapping,
  SavedMapping,
  SheetData,
  SheetSummary,
  StagedRow,
  UnknownEnumValues,
  ValidateCtx,
} from './types';
import { throttleProgress } from '@/lib/workers/progress';
import { transferBuffer } from '@/lib/workers/transfer';

const MAX_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_ROWS = 200_000;

class ImportWorker implements ImportWorkerApi {
  private workbook: XLSX.WorkBook | null = null;
  private currentSheetName: string | null = null;
  private rawHeaders: string[] = [];
  private dataRows: unknown[][] = [];
  private validatedRows: StagedRow[] = [];

  async readFile(
    fileOrBuffer: File | ArrayBuffer,
    opts?: { encoding?: string; fileName?: string }
  ): Promise<{ sheets: SheetSummary[] }> {
    let buffer: ArrayBuffer;
    if (fileOrBuffer instanceof File) {
      if (fileOrBuffer.size > MAX_BYTES) {
        throw new Error('IMPORT_TOO_LARGE');
      }
      buffer = await fileOrBuffer.arrayBuffer();
    } else {
      if (fileOrBuffer.byteLength > MAX_BYTES) {
        throw new Error('IMPORT_TOO_LARGE');
      }
      buffer = fileOrBuffer;
    }

    const uint8 = new Uint8Array(buffer);
    const fileName = opts?.fileName || '';
    const isCsvOrText =
      fileName.endsWith('.csv') ||
      fileName.endsWith('.tsv') ||
      fileName.endsWith('.txt');

    let readOpts: XLSX.ParsingOptions = {
      type: 'array',
      dense: true,
      cellDates: true,
      raw: false,
    };

    if (isCsvOrText) {
      const enc = opts?.encoding || detectEncoding(uint8);
      let text: string;
      try {
        const decoder = new TextDecoder(enc);
        text = decoder.decode(uint8);
      } catch {
        const fallback = new TextDecoder('utf-8');
        text = fallback.decode(uint8);
      }
      const delim = detectDelimiter(text);
      readOpts = {
        type: 'string',
        dense: true,
        raw: false,
        FS: delim,
      };
      this.workbook = XLSX.read(text, readOpts);
    } else {
      this.workbook = XLSX.read(buffer, readOpts);
    }

    const sheets: SheetSummary[] = [];
    for (const name of this.workbook.SheetNames) {
      const ws = this.workbook.Sheets[name];
      if (!ws) continue;
      const ref = ws['!ref'] || 'A1:A1';
      const range = XLSX.utils.decode_range(ref);
      const rowCount = Math.max(0, range.e.r - range.s.r + 1);
      sheets.push({ name, rows: rowCount });
    }

    return { sheets };
  }

  async loadSheet(name: string, opts?: { headerRow?: number }): Promise<SheetData> {
    if (!this.workbook) {
      throw new Error('No workbook loaded');
    }

    const ws = this.workbook.Sheets[name];
    if (!ws) {
      throw new Error(`Sheet ${name} not found`);
    }

    this.currentSheetName = name;

    // Propagate merged cells if present
    if (ws['!merges'] && Array.isArray(ws['!merges'])) {
      for (const merge of ws['!merges']) {
        const masterCellRef = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
        const masterVal = ws[masterCellRef];
        if (masterVal) {
          for (let r = merge.s.r; r <= merge.e.r; r++) {
            for (let c = merge.s.c; c <= merge.e.c; c++) {
              if (r === merge.s.r && c === merge.s.c) continue;
              const cellRef = XLSX.utils.encode_cell({ r, c });
              ws[cellRef] = { ...masterVal };
            }
          }
        }
      }
    }

    // Convert to 2D array (dense matrix)
    const rawMatrix = (XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: '',
      blankrows: false,
    }) as unknown[][]) || [];

    // Filter out completely blank rows
    const cleanedMatrix = rawMatrix.filter((row) =>
      Array.isArray(row) && row.some((c) => c !== null && c !== undefined && String(c).trim().length > 0)
    );

    const detectedHeaderRow = opts?.headerRow ?? detectHeaderRowIndex(cleanedMatrix);
    const headerRowIdx = Math.max(0, detectedHeaderRow - 1);

    const rawHeaderRow = cleanedMatrix[headerRowIdx] || [];
    this.rawHeaders = rawHeaderRow.map((h, i) => {
      const str = String(cleanCellValue(h)).trim();
      return str.length > 0 ? str : `Column_${i + 1}`;
    });

    // Extract data rows below header
    const rowsBelow = cleanedMatrix.slice(headerRowIdx + 1);
    this.dataRows = rowsBelow.filter((row) => {
      // Skip template example row
      return !row.some((cell) => typeof cell === 'string' && cell.trim() === '#example');
    });

    if (this.dataRows.length > MAX_ROWS) {
      throw new Error('IMPORT_TOO_LARGE');
    }

    // Prepare 10 sample rows
    const sample: string[][] = this.dataRows.slice(0, 10).map((row) =>
      this.rawHeaders.map((_, colIdx) => {
        const val = row[colIdx];
        return val !== null && val !== undefined ? String(val).trim() : '';
      })
    );

    return {
      headers: this.rawHeaders,
      sample,
      totalRows: this.dataRows.length,
      detectedHeaderRow,
    };
  }

  async autoMap(ctx: {
    industries: IndustryRef[];
    countries: CountryRef[];
    savedMappings: SavedMapping[];
  }): Promise<Mapping> {
    const sampleMatrix = this.dataRows.slice(0, 50).map((row) =>
      this.rawHeaders.map((_, colIdx) => {
        const val = row[colIdx];
        return val !== null && val !== undefined ? String(val).trim() : '';
      })
    );
    return autoMapColumns(this.rawHeaders, sampleMatrix, ctx);
  }

  async unknownValues(mapping: Mapping): Promise<UnknownEnumValues> {
    const unknowns: UnknownEnumValues = {
      industry: [],
      stage: [],
      country: [],
      tri: [],
    };

    const indSet = new Set<string>();
    const stageSet = new Set<string>();
    const countrySet = new Set<string>();
    const triSet = new Set<string>();

    this.rawHeaders.forEach((header, colIdx) => {
      const colMap = mapping[header];
      if (!colMap || colMap.target === 'ignore' || colMap.target === 'notes_append') return;

      for (const row of this.dataRows) {
        const val = row[colIdx];
        if (val === null || val === undefined) continue;
        const str = String(val).trim();
        if (!str) continue;

        if (colMap.target === 'industry' && matchIndustry(str, []) === null) {
          indSet.add(str);
        } else if (colMap.target === 'stage' && matchStage(str) === null) {
          stageSet.add(str);
        } else if (colMap.target === 'country' && matchCountry(str, []) === null) {
          countrySet.add(str);
        } else if (
          ['has_content', 'appears_in_content', 'has_videographer'].includes(colMap.target) &&
          matchTriState(str) === null
        ) {
          triSet.add(str);
        }
      }
    });

    unknowns.industry = Array.from(indSet).slice(0, 100);
    unknowns.stage = Array.from(stageSet).slice(0, 100);
    unknowns.country = Array.from(countrySet).slice(0, 100);
    unknowns.tri = Array.from(triSet).slice(0, 100);

    return unknowns;
  }

  async validateAll(
    mapping: Mapping,
    ctx: ValidateCtx,
    onProgress: (done: number, total: number) => void
  ): Promise<{ counts: ImportCounts }> {
    const throttled = throttleProgress(onProgress, 100);
    const total = this.dataRows.length;

    this.validatedRows = [];
    const counts: ImportCounts = {
      valid: 0,
      incomplete: 0,
      error: 0,
      duplicate_db: 0,
      duplicate_file: 0,
      total,
    };

    for (let i = 0; i < total; i++) {
      const row = this.dataRows[i];
      if (!row) continue;
      const rowNo = i + 1;

      const rawRecord: Record<string, unknown> = {};
      const dataRecord: Record<string, unknown> = {};
      const issues: ImportIssue[] = [];
      const appendedNotes: string[] = [];

      this.rawHeaders.forEach((header, colIdx) => {
        const val = cleanCellValue(row[colIdx]);
        rawRecord[header] = val;

        const colMap = mapping[header];
        if (!colMap || colMap.target === 'ignore') return;

        if (colMap.target === 'notes_append') {
          if (val !== '') {
            appendedNotes.push(`${header}: ${String(val)}`);
          }
          return;
        }

        dataRecord[colMap.target] = val;
      });

      // Append notes if any
      if (appendedNotes.length > 0) {
        const existingNotes = dataRecord.notes ? String(dataRecord.notes) : '';
        dataRecord.notes = existingNotes
          ? `${existingNotes}\n${appendedNotes.join('\n')}`
          : appendedNotes.join('\n');
      }

      // 1. Validate Name
      const name = dataRecord.name ? String(dataRecord.name).trim() : '';
      if (!name) {
        issues.push({ field: 'name', code: 'required', message: 'اسم العميل مطلوب' });
      }

      // 2. Normalize and validate Instagram Handle
      let igHandle = dataRecord.instagram ? String(dataRecord.instagram).trim() : null;
      if (igHandle) {
        igHandle = igHandle
          .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
          .replace(/^@/, '')
          .replace(/[/?#].*$/, '')
          .trim();
        if (!/^[a-zA-Z0-9._]{1,30}$/.test(igHandle)) {
          issues.push({
            field: 'instagram_handle',
            code: 'invalid_handle',
            message: 'اسم مستخدم إنستجرام غير صالح',
          });
          igHandle = null;
        }
      }
      dataRecord.instagram_handle = igHandle;
      delete dataRecord.instagram;

      // 3. Normalize and validate WhatsApp Phone
      let waPhone = dataRecord.whatsapp ? String(dataRecord.whatsapp).trim() : null;
      if (waPhone) {
        try {
          const defaultCountry = ctx.defaultCountry as CountryCode | undefined;
          const parsed = parsePhoneNumberWithError(waPhone, defaultCountry || undefined);
          if (parsed && parsed.isValid()) {
            waPhone = parsed.number; // E.164 (+2010...)
          } else {
            issues.push({
              field: 'whatsapp_e164',
              code: 'invalid_phone',
              message: 'رقم الواتساب غير صحيح',
            });
            waPhone = null;
          }
        } catch {
          issues.push({
            field: 'whatsapp_e164',
            code: 'invalid_phone',
            message: 'رقم الواتساب غير صحيح',
          });
          waPhone = null;
        }
      }
      dataRecord.whatsapp_e164 = waPhone;
      delete dataRecord.whatsapp;

      // Check contact requirement (must have at least one valid channel)
      if (!igHandle && !waPhone) {
        issues.push({
          field: 'contact',
          code: 'missing_contact',
          message: 'يجب توفير وسيلة تواصل واحدة على الأقل (إنستجرام أو واتساب)',
        });
      }

      // 4. Normalize Country
      let countryCode = dataRecord.country
        ? matchCountry(dataRecord.country, [])
        : ctx.defaultCountry || null;
      if (!countryCode && ctx.countryOverrides && dataRecord.country) {
        countryCode = ctx.countryOverrides[String(dataRecord.country)] || null;
      }
      dataRecord.country_code = countryCode;
      delete dataRecord.country;

      // 5. Normalize Industry
      let industryId = dataRecord.industry
        ? matchIndustry(dataRecord.industry, [])
        : ctx.defaultIndustryId || null;
      if (!industryId && ctx.industryOverrides && dataRecord.industry) {
        industryId = ctx.industryOverrides[String(dataRecord.industry)] || null;
      }
      dataRecord.industry_id = industryId;
      delete dataRecord.industry;

      // 6. Normalize Stage
      let stage = dataRecord.stage ? matchStage(dataRecord.stage) : ctx.defaultStage || 'new';
      if (ctx.stageOverrides && dataRecord.stage) {
        stage = ctx.stageOverrides[String(dataRecord.stage)] || stage;
      }
      dataRecord.stage = stage || 'new';

      // 7. Normalize Tri-States
      dataRecord.has_content = matchTriState(dataRecord.has_content) === 'yes';
      dataRecord.appears_in_content = matchTriState(dataRecord.appears_in_content) === 'yes';
      dataRecord.has_videographer = matchTriState(dataRecord.has_videographer) || 'unknown';

      // Classify Status
      const hasFatalErrors = issues.some((iss) => ['required', 'missing_contact'].includes(iss.code));
      let status: StagedRow['status'];

      if (hasFatalErrors) {
        status = 'error';
        counts.error++;
      } else {
        const missingFields: string[] = [];
        if (!dataRecord.industry_id) missingFields.push('industry');
        if (!dataRecord.country_code) missingFields.push('country');
        if (!dataRecord.job_title) missingFields.push('job_title');

        if (missingFields.length > 0 || issues.length > 0) {
          status = 'incomplete';
          counts.incomplete++;
        } else {
          status = 'valid';
          counts.valid++;
        }
      }

      this.validatedRows.push({
        row_no: rowNo,
        kind: 'lead',
        raw: rawRecord,
        data: dataRecord,
        status,
        issues,
      });

      throttled(i + 1, total);
    }

    onProgress(total, total);
    return { counts };
  }

  async takeBatch(from: number, size: number): Promise<StagedRow[]> {
    return this.validatedRows.slice(from, from + size);
  }

  async buildProblemsWorkbook(rowNos: number[]): Promise<ArrayBuffer> {
    const rowNoSet = new Set(rowNos);
    const problemRows = this.validatedRows.filter((r) => rowNoSet.has(r.row_no));

    const exportRows = problemRows.map((r) => {
      const rowObj: Record<string, unknown> = {
        'رقم الصف': r.row_no,
        'حالة الصف': r.status,
        'المشاكل المكتشفة': r.issues.map((i) => i.message || i.code).join(' | '),
      };
      // Add raw columns
      for (const [k, v] of Object.entries(r.raw)) {
        rowObj[k] = v;
      }
      return rowObj;
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'صفوف المشاكل');
    const u8 = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const buffer = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
    return transferBuffer(buffer);
  }
}

Comlink.expose(new ImportWorker());
