import type {
  ImportJob,
  ImportRow,
  ImportRowStatus,
  ImportDecision,
  TriState,
  LeadStage,
} from '@/types/database';

export type {
  ImportJob,
  ImportRow,
  ImportRowStatus,
  ImportDecision,
  TriState,
  LeadStage,
};

export type LeadField =
  | 'name'
  | 'company'
  | 'industry'
  | 'job_title'
  | 'instagram'
  | 'whatsapp'
  | 'country'
  | 'notes'
  | 'has_content'
  | 'appears_in_content'
  | 'has_videographer'
  | 'problems'
  | 'stage';

export type MappingTarget = LeadField | 'notes_append' | 'ignore';

export interface ColumnMapping {
  target: MappingTarget;
  confidence: number;
  reason?: string;
}

export type Mapping = Record<string, ColumnMapping>;

export interface SavedMapping {
  signature: string;
  mapping: Record<string, MappingTarget>;
  updatedAt: string;
}

export interface IndustryRef {
  id: number;
  key: string;
  label_ar: string;
  label_en: string;
}

export interface CountryRef {
  code: string;
  name_ar: string;
  name_en: string;
}

export interface SheetSummary {
  name: string;
  rows: number;
}

export interface SheetData {
  headers: string[];
  sample: string[][];
  totalRows: number;
  detectedHeaderRow: number;
}

export interface UnknownEnumValues {
  industry: string[];
  stage: string[];
  country: string[];
  tri: string[];
}

export interface ValidateCtx {
  defaultCountry?: string | null;
  defaultIndustryId?: number | null;
  defaultStage?: LeadStage | null;
  duplicateStrategy?: 'skip' | 'fill_empty' | 'replace';
  industryOverrides?: Record<string, number>;
  countryOverrides?: Record<string, string>;
  stageOverrides?: Record<string, LeadStage>;
  triOverrides?: Record<string, TriState>;
}

export interface ImportIssue {
  field: string;
  code: string;
  message?: string;
}

export interface StagedRow {
  row_no: number;
  kind: 'lead' | 'event' | 'industry' | 'settings';
  raw: Record<string, unknown>;
  data: Record<string, unknown>;
  status: ImportRowStatus;
  issues: ImportIssue[];
}

export interface ImportCounts {
  valid: number;
  incomplete: number;
  error: number;
  duplicate_db: number;
  duplicate_file: number;
  total: number;
}

export interface ImportWorkerApi {
  readFile(
    fileOrBuffer: File | ArrayBuffer,
    opts?: { encoding?: string; fileName?: string }
  ): Promise<{ sheets: SheetSummary[] }>;
  loadSheet(
    name: string,
    opts?: { headerRow?: number }
  ): Promise<SheetData>;
  autoMap(ctx: {
    industries: IndustryRef[];
    countries: CountryRef[];
    savedMappings: SavedMapping[];
  }): Promise<Mapping>;
  unknownValues(mapping: Mapping): Promise<UnknownEnumValues>;
  validateAll(
    mapping: Mapping,
    ctx: ValidateCtx,
    onProgress: (done: number, total: number) => void
  ): Promise<{ counts: ImportCounts }>;
  takeBatch(from: number, size: number): Promise<StagedRow[]>;
  buildProblemsWorkbook(rowNos: number[]): Promise<ArrayBuffer>;
}
