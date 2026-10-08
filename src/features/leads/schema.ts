import { z } from 'zod';
import type { LeadStage, TriState, Database } from '@/types/database';
import { prepareQuery } from './prepare-query';

export const leadInputSchema = z
  .object({
    name: z.string().trim().min(1, 'required').max(120),
    company: z.string().trim().max(120).optional().nullable(),
    industry_id: z.number().int().positive().nullable(),
    industry_other: z.string().trim().max(80).optional().nullable(),
    job_title: z.string().trim().max(80).optional().nullable(),
    instagram_handle: z
      .string()
      .regex(/^[a-z0-9._]{1,30}$/, 'invalid_handle')
      .nullable(),
    whatsapp_e164: z
      .string()
      .regex(/^\+[1-9]\d{6,14}$/, 'invalid_phone')
      .nullable(),
    country_code: z.string().length(2).nullable(),
    notes: z.string().max(5000).optional().nullable(),
    has_content: z.boolean().nullable(),
    appears_in_content: z.boolean().nullable(),
    has_videographer: z.enum(['yes', 'no', 'unknown'] as const).default('unknown'),
    problems: z.string().trim().max(280).optional().nullable(),
  })
  .refine((v) => Boolean(v.instagram_handle || v.whatsapp_e164), {
    path: ['instagram_handle'],
    message: 'contact_required',
  });

export type LeadInput = z.infer<typeof leadInputSchema>;

export type Lead = Database['public']['Tables']['leads']['Row'];
export type LeadInsert = Database['public']['Tables']['leads']['Insert'];
export type LeadUpdate = Database['public']['Tables']['leads']['Update'];

export type LeadSort =
  | 'newest'
  | 'oldest'
  | 'last_contact'
  | 'next_follow_up'
  | 'name'
  | 'relevance';

export type LeadListRow = {
  id: string;
  name: string;
  company: string | null;
  instagram_handle: string | null;
  whatsapp_e164: string | null;
  industry_id: number | null;
  industry_other: string | null;
  country_code: string | null;
  stage: LeadStage;
  last_contacted_at: string | null;
  next_follow_up_on: string | null;
  follow_ups_sent: number;
  missing_fields: string[];
  created_at: string;
  rank: number;
  next_cursor: unknown;
};

export type LeadFilters = {
  q?: string;
  stages?: LeadStage[];
  industries?: number[];
  countries?: string[];
  sort?: LeadSort;
  has_content?: boolean;
  appears_in_content?: boolean;
  has_videographer?: TriState;
  has_whatsapp?: boolean;
  due?: boolean;
  missing?: string[] | 'any';
  import_job_id?: string;
  created_from?: string;
  created_to?: string;
};

export type RpcSearchLeadsArgs = {
  p_query: string | null;
  p_stages: LeadStage[] | null;
  p_industries: number[] | null;
  p_countries: string[] | null;
  p_filters: Record<string, unknown>;
  p_sort: LeadSort;
};

/**
 * Transforms client filters state into arguments suitable for search_leads RPC.
 */
export function filtersToRpcArgs(filters: LeadFilters): RpcSearchLeadsArgs {
  const pFilters: Record<string, unknown> = {};

  if (filters.has_content !== undefined) pFilters.has_content = filters.has_content;
  if (filters.appears_in_content !== undefined) pFilters.appears_in_content = filters.appears_in_content;
  if (filters.has_videographer !== undefined && filters.has_videographer !== 'unknown') {
    pFilters.has_videographer = filters.has_videographer;
  }
  if (filters.has_whatsapp) pFilters.has_whatsapp = true;
  if (filters.due) pFilters.due = true;
  if (filters.missing) pFilters.missing = filters.missing;
  if (filters.import_job_id) pFilters.import_job_id = filters.import_job_id;
  if (filters.created_from) pFilters.created_from = filters.created_from;
  if (filters.created_to) pFilters.created_to = filters.created_to;

  const rawQuery = filters.q?.trim();
  const prepared = rawQuery ? prepareQuery(rawQuery) : null;

  return {
    p_query: prepared || null,
    p_stages: filters.stages && filters.stages.length > 0 ? filters.stages : null,
    p_industries: filters.industries && filters.industries.length > 0 ? filters.industries : null,
    p_countries: filters.countries && filters.countries.length > 0 ? filters.countries : null,
    p_filters: pFilters,
    p_sort: filters.sort || 'newest',
  };
}
