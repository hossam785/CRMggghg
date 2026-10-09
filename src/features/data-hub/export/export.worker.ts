import * as Comlink from 'comlink';
import ExcelJS from 'exceljs';
import { buildCsvOrZip, type CsvSheetData } from './csv';
import type { ExportWorkerApi, SerializableSpec, SerializableColumnDef } from './types';

const STAGE_COLORS: Record<string, { bg: string; fg: string }> = {
  new: { bg: 'FFDBEAFE', fg: 'FF1E40AF' },
  contacted: { bg: 'FFFEF3C7', fg: 'FF92400E' },
  follow_up_1: { bg: 'FFFDE68A', fg: 'FF854D0E' },
  follow_up_2: { bg: 'FFFED7AA', fg: 'FF9A3412' },
  follow_up_3: { bg: 'FFFFEDD5', fg: 'FFC2410C' },
  replied: { bg: 'FFE0E7FF', fg: 'FF3730A3' },
  meeting_booked: { bg: 'FFD1FAE5', fg: 'FF065F46' },
  proposal_sent: { bg: 'FFCFFAFE', fg: 'FF155E75' },
  won: { bg: 'FFDCFCE7', fg: 'FF166534' },
  lost: { bg: 'FFFEE2E2', fg: 'FF991B1B' },
};

class ExportWorker implements ExportWorkerApi {
  private spec: SerializableSpec | null = null;
  private locale: 'ar' | 'en' = 'ar';
  private format: 'xlsx' | 'csv' = 'xlsx';
  private totalRows = 0;

  // ExcelJS state
  private workbook: ExcelJS.Workbook | null = null;
  private worksheets: Map<string, ExcelJS.Worksheet> = new Map();

  // CSV state
  private csvSheets: Map<string, CsvSheetData> = new Map();

  async begin(
    spec: SerializableSpec,
    locale: 'ar' | 'en',
    format: 'xlsx' | 'csv'
  ): Promise<void> {
    this.spec = spec;
    this.locale = locale;
    this.format = format;
    this.totalRows = 0;
    this.worksheets.clear();
    this.csvSheets.clear();

    const isRtl = locale === 'ar';

    if (format === 'xlsx') {
      this.workbook = new ExcelJS.Workbook();
      this.workbook.creator = 'Scope CRM';
      this.workbook.created = new Date();

      for (const sheetSpec of spec.sheets) {
        const ws = this.workbook.addWorksheet(sheetSpec.name, {
          views: [{ state: 'frozen', ySplit: 1, rightToLeft: isRtl }],
        });

        // Set column definitions
        ws.columns = sheetSpec.columns.map((col) => ({
          header: col.header,
          key: col.key,
          width: col.width || 18,
        }));

        // Format header row (Row 1)
        const headerRow = ws.getRow(1);
        headerRow.height = 26;
        headerRow.eachCell((cell) => {
          cell.font = {
            name: isRtl ? 'Arial' : 'Calibri',
            size: 11,
            bold: true,
            color: { argb: 'FFFFFFFF' },
          };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E293B' }, // Dark slate
          };
          cell.alignment = {
            vertical: 'middle',
            horizontal: isRtl ? 'right' : 'left',
          };
        });

        // Add autoFilter
        if (sheetSpec.columns.length > 0) {
          ws.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: sheetSpec.columns.length },
          };
        }

        this.worksheets.set(sheetSpec.name, ws);
      }
    } else {
      // CSV format initialization
      for (const sheetSpec of spec.sheets) {
        this.csvSheets.set(sheetSpec.name, {
          name: sheetSpec.name,
          headers: sheetSpec.columns.map((c) => c.header),
          rows: [],
        });
      }
    }
  }

  async addRows(sheetName: string, rows: Record<string, unknown>[]): Promise<void> {
    this.totalRows += rows.length;

    // Safety memory guard
    if (this.format === 'xlsx' && this.totalRows > 200000) {
      throw new Error(
        'EXPORT_TOO_LARGE: Total rows exceed 200,000 for Excel format. Please choose CSV format.'
      );
    }

    const sheetSpec = this.spec?.sheets.find((s) => s.name === sheetName);
    const colMap: Record<string, SerializableColumnDef> = {};
    if (sheetSpec) {
      for (const c of sheetSpec.columns) {
        colMap[c.key] = c;
      }
    }

    if (this.format === 'xlsx') {
      const ws = this.worksheets.get(sheetName);
      if (!ws) return;

      const isRtl = this.locale === 'ar';

      for (const rowData of rows) {
        const row = ws.addRow(rowData);
        row.height = 20;

        row.eachCell((cell, colNumber) => {
          const colKey = ws.getColumn(colNumber).key;
          const colDef = colKey ? colMap[colKey] : undefined;

          // Default font & alignment
          cell.font = {
            name: isRtl ? 'Arial' : 'Calibri',
            size: 10,
          };
          cell.alignment = {
            vertical: 'middle',
            horizontal: isRtl ? 'right' : 'left',
          };

          if (colDef) {
            const rawVal = rowData[colDef.key];

            if (colDef.format === 'datetime' || colDef.format === 'date') {
              if (rawVal) {
                const dateObj = new Date(String(rawVal));
                if (!isNaN(dateObj.getTime())) {
                  cell.value = dateObj;
                  cell.numFmt =
                    colDef.format === 'datetime' ? 'yyyy-mm-dd hh:mm' : 'yyyy-mm-dd';
                }
              }
            } else if (colDef.format === 'link') {
              if (rawVal && typeof rawVal === 'string') {
                let url = rawVal;
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                  if (rawVal.startsWith('@') || colDef.key.includes('instagram')) {
                    url = `https://instagram.com/${rawVal.replace('@', '')}`;
                  } else if (rawVal.includes('+') || colDef.key.includes('whatsapp') || colDef.key.includes('phone')) {
                    url = `https://wa.me/${rawVal.replace(/[^0-9]/g, '')}`;
                  }
                }
                cell.value = { text: rawVal, hyperlink: url };
                cell.font = {
                  color: { argb: 'FF2563EB' },
                  underline: true,
                  size: 10,
                };
              }
            } else if (colDef.format === 'stage') {
              const stageKey = String(rawVal);
              const colorInfo = STAGE_COLORS[stageKey];
              if (colorInfo) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: colorInfo.bg },
                };
                cell.font = {
                  color: { argb: colorInfo.fg },
                  bold: true,
                  size: 10,
                };
              }
            }
          }
        });

        row.commit();
      }
    } else {
      // CSV format
      const csvSheet = this.csvSheets.get(sheetName);
      if (!csvSheet || !sheetSpec) return;

      for (const rowData of rows) {
        const rowCells = sheetSpec.columns.map((col) => {
          const val = rowData[col.key];
          if (val === null || val === undefined) return '';
          if (col.format === 'datetime' || col.format === 'date') {
            const d = new Date(String(val));
            return isNaN(d.getTime()) ? String(val) : d.toISOString().replace('T', ' ').slice(0, 19);
          }
          return String(val);
        });
        csvSheet.rows.push(rowCells);
      }
    }
  }

  async finish(): Promise<ArrayBuffer> {
    if (this.format === 'xlsx') {
      if (!this.workbook) throw new Error('Workbook not initialized');
      const buffer = (await this.workbook.xlsx.writeBuffer()) as ArrayBuffer;
      return Comlink.transfer(buffer, [buffer]);
    } else {
      const sheetsList = Array.from(this.csvSheets.values());
      const bytes = buildCsvOrZip(sheetsList);
      const buffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer;
      return Comlink.transfer(buffer, [buffer]);
    }
  }
}

Comlink.expose(new ExportWorker());
