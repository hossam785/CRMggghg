'use client';

import { useState, useEffect } from 'react';
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { invalidate } from '@/lib/invalidate';
import { leadsApi } from './api';
import { filtersToRpcArgs, type LeadFilters, type LeadInput, type LeadUpdate } from './schema';
import { buildCursor } from './cursor';

/**
 * Infinite query for fetching leads with keyset/offset pagination.
 * Fetches limit+1 rows to determine if a next page exists without count(*).
 */
export function useLeadsInfinite(filters: LeadFilters) {
  return useInfiniteQuery({
    queryKey: qk.leads(filters),
    queryFn: ({ pageParam, signal }) =>
      leadsApi.searchLeads(
        {
          ...filtersToRpcArgs(filters),
          p_cursor: pageParam,
          p_limit: 51,
        },
        signal
      ),
    initialPageParam: null as unknown,
    getNextPageParam: (last, allPages) => {
      if (last && last.length > 50) {
        const lastRow = last[49];
        if (!lastRow) return undefined;
        const currentOffset =
          filters.sort === 'relevance' ? (allPages.length - 1) * 50 : undefined;
        return buildCursor(filters.sort || 'newest', lastRow, currentOffset);
      }
      return undefined;
    },
    select: (data) => ({
      ...data,
      pages: data.pages.map((p) => p.slice(0, 50)),
    }),
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetches aggregate lead counts grouped by stage for pipeline tab counters.
 */
export function useStageCounts(filters: LeadFilters) {
  return useQuery({
    queryKey: qk.stageCounts(filters),
    queryFn: ({ signal }) => leadsApi.stageCounts(filtersToRpcArgs(filters), signal),
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetches a single lead by its unique id.
 */
export function useLead(id: string) {
  return useQuery({
    queryKey: qk.lead(id),
    queryFn: ({ signal }) => leadsApi.getLead(id, signal),
    enabled: Boolean(id),
  });
}

/**
 * Fetches active industries (reference data with infinite cache lifetime).
 */
export function useIndustries() {
  return useQuery({
    queryKey: qk.industries(),
    queryFn: ({ signal }) => leadsApi.listIndustries(signal),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Fetches reference countries (reference data with infinite cache lifetime).
 */
export function useCountries() {
  return useQuery({
    queryKey: qk.countries(),
    queryFn: ({ signal }) => leadsApi.listCountries(signal),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Fuzzy search suggestions ("هل تقصد؟") enabled when direct search returns 0 results and query is at least 3 chars.
 */
export function useSuggest(query: string, enabled: boolean) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: qk.suggest(trimmed),
    queryFn: ({ signal }) => leadsApi.suggestLeads({ p_query: trimmed, p_limit: 5 }, signal),
    enabled: enabled && trimmed.length >= 3,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Debounced duplicate check (300ms) for Instagram handle and WhatsApp phone number.
 */
export function useDuplicateCheck(params: {
  handle?: string | null;
  phone?: string | null;
  excludeId?: string | null;
}) {
  const { handle, phone, excludeId } = params;
  const [debouncedParams, setDebouncedParams] = useState({ handle, phone, excludeId });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedParams({ handle, phone, excludeId });
    }, 300);
    return () => clearTimeout(timer);
  }, [handle, phone, excludeId]);

  const hasSearchKey = Boolean(
    (debouncedParams.handle && debouncedParams.handle.length >= 2) ||
      (debouncedParams.phone && debouncedParams.phone.length >= 7)
  );

  return useQuery({
    queryKey: qk.duplicate(debouncedParams.handle, debouncedParams.phone, debouncedParams.excludeId),
    queryFn: ({ signal }) =>
      leadsApi.checkDuplicate(
        {
          p_handle: debouncedParams.handle,
          p_phone: debouncedParams.phone,
          p_exclude: debouncedParams.excludeId,
        },
        signal
      ),
    enabled: hasSearchKey,
    staleTime: 1000 * 30,
  });
}

/**
 * Mutation for creating a new lead with automatic cache invalidation.
 */
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LeadInput) => leadsApi.createLead(input),
    onSuccess: () => {
      void invalidate.afterLeadCreate(queryClient);
    },
  });
}

/**
 * Mutation for updating lead fields.
 */
export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: LeadUpdate }) =>
      leadsApi.updateLead(id, patch),
    onSuccess: (data) => {
      void invalidate.afterLeadEdit(queryClient, data.id);
    },
  });
}

/**
 * Mutation for soft-deleting a lead.
 */
export function useSoftDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => leadsApi.softDeleteLead(id),
    onSuccess: (_, id) => {
      void invalidate.afterLeadDelete(queryClient, id);
    },
  });
}

/**
 * Mutation for restoring a soft-deleted lead.
 */
export function useRestoreLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => leadsApi.restoreLead(id),
    onSuccess: (_, id) => {
      void invalidate.afterLeadRestore(queryClient, [id]);
    },
  });
}

/**
 * Query for retrieving soft-deleted leads in trash.
 */
export function useTrashLeads() {
  return useQuery({
    queryKey: qk.trash(),
    queryFn: ({ signal }) => leadsApi.listTrashLeads(signal),
    staleTime: 1000 * 30,
  });
}

/**
 * Mutation for bulk restoring soft-deleted leads.
 */
export function useBulkRestoreLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => leadsApi.bulkRestoreLeads(ids),
    onSuccess: (_, ids) => {
      void invalidate.afterLeadRestore(queryClient, ids);
    },
  });
}

