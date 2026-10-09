'use client';

import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { pipelineApi, type LeadEventRow } from './api';

export function useLeadEvents(leadId: string) {
  return useQuery<LeadEventRow[]>({
    queryKey: qk.leadEvents(leadId),
    queryFn: ({ signal }) => pipelineApi.listLeadEvents(leadId, signal),
    enabled: Boolean(leadId),
    staleTime: 30_000,
  });
}
