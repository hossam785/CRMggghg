/**
 * Centralized React Query key definitions.
 * Ensures consistent cache scoping and invalidation across all features.
 */
export const qk = {
  leads: (filters?: unknown) => (filters !== undefined ? (['leads', filters] as const) : (['leads'] as const)),
  lead: (id: string) => ['lead', id] as const,
  stageCounts: (filters?: unknown) =>
    filters !== undefined ? (['stage-counts', filters] as const) : (['stage-counts'] as const),
  suggest: (q: string) => ['suggest', q] as const,
  duplicate: (handle?: string | null, phone?: string | null, excludeId?: string | null) =>
    ['duplicate', handle, phone, excludeId] as const,
  industries: () => ['industries'] as const,
  countries: () => ['countries'] as const,
  leadEvents: (id: string) => ['lead-events', id] as const,
  followUps: () => ['follow-ups'] as const,
  dashboard: () => ['dashboard'] as const,
  settings: () => ['settings'] as const,
  backupSettings: () => ['backup-settings'] as const,
};
