import type { QueryClient } from '@tanstack/react-query';

/**
 * Centralized React Query invalidation rules (§18.4.7).
 * Ensures invalidations are narrowly scoped, predictable, and maintainable.
 */
export const invalidate = {
  afterLeadAction: (qc: QueryClient, id: string) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['lead-events', id] }),
      qc.invalidateQueries({ queryKey: ['leads'] }),
      qc.invalidateQueries({ queryKey: ['stage-counts'] }),
      qc.invalidateQueries({ queryKey: ['follow-ups'] }),
      qc.invalidateQueries({ queryKey: ['dashboard'] }),
      qc.invalidateQueries({ queryKey: ['lead', id] }),
    ]),

  afterLeadEdit: (qc: QueryClient, id: string) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['leads'] }),
      qc.invalidateQueries({ queryKey: ['stage-counts'] }),
      qc.invalidateQueries({ queryKey: ['lead', id] }),
      qc.invalidateQueries({ queryKey: ['follow-ups'] }),
      qc.invalidateQueries({ queryKey: ['dashboard'] }),
    ]),

  afterLeadCreate: (qc: QueryClient) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['leads'] }),
      qc.invalidateQueries({ queryKey: ['stage-counts'] }),
      qc.invalidateQueries({ queryKey: ['dashboard'] }),
    ]),

  afterLeadDelete: (qc: QueryClient, id?: string) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['leads'] }),
      qc.invalidateQueries({ queryKey: ['stage-counts'] }),
      qc.invalidateQueries({ queryKey: ['follow-ups'] }),
      qc.invalidateQueries({ queryKey: ['dashboard'] }),
      qc.invalidateQueries({ queryKey: ['trash'] }),
      ...(id ? [qc.invalidateQueries({ queryKey: ['lead', id] })] : []),
    ]),

  afterLeadRestore: (qc: QueryClient, ids?: string[]) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['leads'] }),
      qc.invalidateQueries({ queryKey: ['stage-counts'] }),
      qc.invalidateQueries({ queryKey: ['follow-ups'] }),
      qc.invalidateQueries({ queryKey: ['dashboard'] }),
      qc.invalidateQueries({ queryKey: ['trash'] }),
      ...(ids ? ids.map((id) => qc.invalidateQueries({ queryKey: ['lead', id] })) : []),
    ]),

  afterImport: (qc: QueryClient) => qc.invalidateQueries(),
};
