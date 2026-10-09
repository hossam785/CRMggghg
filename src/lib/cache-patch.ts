import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { LeadPipelineFields } from '@/features/pipeline/optimistic';

export interface QuerySnapshotEntry {
  queryKey: QueryKey;
  data: unknown;
}

export type QuerySnapshot = QuerySnapshotEntry[];

/**
 * Snapshots the current cached data for the specified query key prefixes.
 */
export function snapshotQueries(
  qc: QueryClient,
  keyPrefixes: readonly (readonly unknown[])[]
): QuerySnapshot {
  const snapshot: QuerySnapshot = [];
  const queryCache = qc.getQueryCache();

  for (const prefix of keyPrefixes) {
    const matched = queryCache.findAll({ queryKey: prefix as QueryKey });
    for (const q of matched) {
      snapshot.push({
        queryKey: q.queryKey,
        data: q.state.data,
      });
    }
  }

  return snapshot;
}

/**
 * Restores cached data from a snapshot.
 */
export function restoreQueries(qc: QueryClient, snapshot?: QuerySnapshot): void {
  if (!snapshot || snapshot.length === 0) return;

  for (const entry of snapshot) {
    qc.setQueryData(entry.queryKey, entry.data);
  }
}

interface InfinitePagesStructure {
  pages: unknown[][];
  pageParams?: unknown[];
}

function isInfinitePages(val: unknown): val is InfinitePagesStructure {
  return (
    typeof val === 'object' &&
    val !== null &&
    'pages' in val &&
    Array.isArray((val as InfinitePagesStructure).pages)
  );
}

/**
 * Updates a lead in all active cache locations:
 * 1. Single lead detail query: ['lead', leadId]
 * 2. Infinite list queries: ['leads', ...]
 * 3. Follow-up queries: ['follow-ups', ...]
 */
export function patchLeadEverywhere<T extends LeadPipelineFields>(
  qc: QueryClient,
  leadId: string,
  updatedFields: Partial<T>
): void {
  // 1. Single lead detail query
  qc.setQueriesData<Record<string, unknown>>({ queryKey: ['lead', leadId] }, (old: Record<string, unknown> | undefined) => {
    if (!old) return old;
    return { ...old, ...updatedFields };
  });

  // 2. Infinite leads queries (pages: LeadListRow[][])
  qc.setQueriesData<unknown>({ queryKey: ['leads'] }, (old: unknown) => {
    if (!isInfinitePages(old)) return old;

    const newPages = old.pages.map((page) => {
      if (!Array.isArray(page)) return page;
      return page.map((row: unknown) => {
        if (
          typeof row === 'object' &&
          row !== null &&
          'id' in row &&
          (row as { id: unknown }).id === leadId
        ) {
          return { ...(row as Record<string, unknown>), ...updatedFields };
        }
        return row;
      });
    });

    return {
      ...old,
      pages: newPages,
    };
  });

  // 3. Follow-up queries
  qc.setQueriesData<unknown>({ queryKey: ['follow-ups'] }, (old: unknown) => {
    if (!old) return old;

    if (Array.isArray(old)) {
      return old.map((item: unknown) => {
        if (
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          (item as { id: unknown }).id === leadId
        ) {
          return { ...(item as Record<string, unknown>), ...updatedFields };
        }
        return item;
      });
    }

    if (
      typeof old === 'object' &&
      old !== null &&
      'buckets' in old &&
      typeof (old as { buckets: unknown }).buckets === 'object' &&
      (old as { buckets: unknown }).buckets !== null
    ) {
      const bucketsObj = (old as { buckets: Record<string, unknown[]> }).buckets;
      const newBuckets: Record<string, unknown[]> = {};

      for (const [bucket, items] of Object.entries(bucketsObj)) {
        if (Array.isArray(items)) {
          newBuckets[bucket] = items.map((item) => {
            if (
              typeof item === 'object' &&
              item !== null &&
              'id' in item &&
              (item as { id: unknown }).id === leadId
            ) {
              return { ...(item as Record<string, unknown>), ...updatedFields };
            }
            return item;
          });
        } else {
          newBuckets[bucket] = items;
        }
      }

      return {
        ...(old as Record<string, unknown>),
        buckets: newBuckets,
      };
    }

    return old;
  });
}

/**
 * Removes a lead from follow-up queue cached queries.
 */
export function removeLeadFromFollowUps(qc: QueryClient, leadId: string): void {
  qc.setQueriesData<unknown>({ queryKey: ['follow-ups'] }, (old: unknown) => {
    if (!old) return old;

    if (Array.isArray(old)) {
      return old.filter(
        (item: unknown) =>
          !(
            typeof item === 'object' &&
            item !== null &&
            'id' in item &&
            (item as { id: unknown }).id === leadId
          )
      );
    }

    if (
      typeof old === 'object' &&
      old !== null &&
      'buckets' in old &&
      typeof (old as { buckets: unknown }).buckets === 'object' &&
      (old as { buckets: unknown }).buckets !== null
    ) {
      const bucketsObj = (old as { buckets: Record<string, unknown[]> }).buckets;
      const newBuckets: Record<string, unknown[]> = {};

      for (const [bucket, items] of Object.entries(bucketsObj)) {
        if (Array.isArray(items)) {
          newBuckets[bucket] = items.filter(
            (item) =>
              !(
                typeof item === 'object' &&
                item !== null &&
                'id' in item &&
                (item as { id: unknown }).id === leadId
              )
          );
        } else {
          newBuckets[bucket] = items;
        }
      }

      return {
        ...(old as Record<string, unknown>),
        buckets: newBuckets,
      };
    }

    return old;
  });
}
