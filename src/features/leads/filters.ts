'use client';

import {
  parseAsString,
  parseAsStringLiteral,
  parseAsArrayOf,
  parseAsInteger,
  parseAsBoolean,
  useQueryStates,
} from 'nuqs';
import type { LeadStage, TriState } from '@/types/database';
import type { LeadFilters, LeadSort } from './schema';

export const LEAD_STAGES: readonly LeadStage[] = [
  'new',
  'message_sent',
  'follow_up_1',
  'follow_up_2',
  'follow_up_3',
  'replied',
  'meeting_booked',
  'proposal_sent',
  'won',
  'lost',
] as const;

export const LEAD_SORTS: readonly LeadSort[] = [
  'newest',
  'oldest',
  'last_contact',
  'next_follow_up',
  'name',
  'relevance',
] as const;

export const TRI_STATE_VALUES: readonly TriState[] = ['yes', 'no', 'unknown'] as const;

export const leadFilterParsers = {
  q: parseAsString.withDefault('').withOptions({ history: 'replace', shallow: true }),
  stages: parseAsArrayOf(parseAsStringLiteral(LEAD_STAGES)).withDefault([]).withOptions({ shallow: true }),
  industries: parseAsArrayOf(parseAsInteger).withDefault([]).withOptions({ shallow: true }),
  countries: parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }),
  sort: parseAsStringLiteral(LEAD_SORTS).withDefault('newest').withOptions({ shallow: true }),
  has_content: parseAsBoolean.withOptions({ shallow: true }),
  appears_in_content: parseAsBoolean.withOptions({ shallow: true }),
  has_videographer: parseAsStringLiteral(TRI_STATE_VALUES).withOptions({ shallow: true }),
  has_whatsapp: parseAsBoolean.withOptions({ shallow: true }),
  due: parseAsBoolean.withOptions({ shallow: true }),
  missing: parseAsArrayOf(parseAsString).withOptions({ shallow: true }),
  import_job_id: parseAsString.withOptions({ shallow: true }),
  created_from: parseAsString.withOptions({ shallow: true }),
  created_to: parseAsString.withOptions({ shallow: true }),
};

/**
 * Hook managing leads list filtering and sorting synced with URL query parameters via nuqs.
 */
export function useLeadFilters() {
  const [filterState, setFilters] = useQueryStates(leadFilterParsers);

  const filters: LeadFilters = {
    q: filterState.q || undefined,
    stages: filterState.stages.length > 0 ? (filterState.stages as LeadStage[]) : undefined,
    industries: filterState.industries.length > 0 ? filterState.industries : undefined,
    countries: filterState.countries.length > 0 ? filterState.countries : undefined,
    sort: filterState.sort,
    has_content: filterState.has_content ?? undefined,
    appears_in_content: filterState.appears_in_content ?? undefined,
    has_videographer: filterState.has_videographer ?? undefined,
    has_whatsapp: filterState.has_whatsapp ?? undefined,
    due: filterState.due ?? undefined,
    missing: filterState.missing && filterState.missing.length > 0 ? filterState.missing : undefined,
    import_job_id: filterState.import_job_id || undefined,
    created_from: filterState.created_from || undefined,
    created_to: filterState.created_to || undefined,
  };

  const resetFilters = () => {
    void setFilters({
      q: '',
      stages: [],
      industries: [],
      countries: [],
      sort: 'newest',
      has_content: null,
      appears_in_content: null,
      has_videographer: null,
      has_whatsapp: null,
      due: null,
      missing: null,
      import_job_id: null,
      created_from: null,
      created_to: null,
    });
  };

  return {
    filters,
    rawState: filterState,
    setFilters,
    resetFilters,
  };
}
