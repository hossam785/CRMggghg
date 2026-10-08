import type { LeadListRow } from './schema';

export type LeadCursor =
  | { k: string; id: string }
  | { offset: number };

/**
 * Builds the keyset or offset cursor for the next page of leads based on the current sort order.
 * Keyset cursor matches the exact expression and type expected by search_leads RPC.
 */
export function buildCursor(sort: string, row: LeadListRow, currentOffset?: number): LeadCursor {
  if (sort === 'relevance') {
    return { offset: (currentOffset ?? 0) + 50 };
  }

  if (sort === 'last_contact') {
    return {
      k: row.last_contacted_at ?? '-infinity',
      id: row.id,
    };
  }

  if (sort === 'next_follow_up') {
    return {
      k: row.next_follow_up_on ?? 'infinity',
      id: row.id,
    };
  }

  if (sort === 'name') {
    return {
      k: row.name.toLowerCase(),
      id: row.id,
    };
  }

  // Default to newest / oldest using created_at
  return {
    k: row.created_at,
    id: row.id,
  };
}
