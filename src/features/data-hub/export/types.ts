export type ColumnFormat =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'link'
  | 'stage'
  | 'boolean'
  | 'enum';

export interface ColumnDef<Row = Record<string, unknown>> {
  key: string;
  header: {
    ar: string;
    en: string;
  };
  width?: number;
  format?: ColumnFormat;
  getValue?: (row: Row) => unknown;
}

export interface SheetSpec<Row = Record<string, unknown>> {
  name: {
    ar: string;
    en: string;
  };
  columns: ColumnDef<Row>[];
  fetchPage: (cursor?: string | number | null) => Promise<{
    rows: Row[];
    nextCursor: string | number | null;
    totalCount?: number;
  }>;
}

export interface ExportSpec<Row = Record<string, unknown>> {
  id: string;
  fileName: string;
  sheets: SheetSpec<Row>[];
}

export interface SerializableColumnDef {
  key: string;
  header: string;
  width: number;
  format: ColumnFormat;
}

export interface SerializableSheetSpec {
  name: string;
  columns: SerializableColumnDef[];
}

export interface SerializableSpec {
  sheets: SerializableSheetSpec[];
}

export interface ExportWorkerApi {
  begin(
    spec: SerializableSpec,
    locale: 'ar' | 'en',
    format: 'xlsx' | 'csv',
    options?: { timezone?: string }
  ): Promise<void>;
  addRows(sheetName: string, rows: Record<string, unknown>[]): Promise<void>;
  finish(): Promise<ArrayBuffer>;
}
