'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import {
  settingsApi,
  industriesApi,
  DEFAULT_SETTINGS,
  type SettingsRow,
  type Industry,
} from './api';

export const SETTINGS_QUERY_KEYS = {
  settings: () => qk.settings(),
  allIndustries: () => ['settings', 'industries', 'all'] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEYS.settings(),
    queryFn: ({ signal }) => settingsApi.getSettings(signal),
    staleTime: 1000 * 60 * 60,
    initialData: DEFAULT_SETTINGS,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<SettingsRow>) => settingsApi.updateSettings(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: SETTINGS_QUERY_KEYS.settings() });
      const previous = queryClient.getQueryData<SettingsRow>(SETTINGS_QUERY_KEYS.settings());
      if (previous) {
        queryClient.setQueryData(SETTINGS_QUERY_KEYS.settings(), {
          ...previous,
          ...patch,
        });
      }
      return { previous };
    },
    onError: (_err, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SETTINGS_QUERY_KEYS.settings(), context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEYS.settings(), data);
    },
  });
}

export function useAllIndustries() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEYS.allIndustries(),
    queryFn: ({ signal }) => industriesApi.listAllIndustries(signal),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateIndustry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { label_ar: string; label_en: string; sort_order?: number }) =>
      industriesApi.createIndustry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEYS.allIndustries() });
      queryClient.invalidateQueries({ queryKey: qk.industries() });
    },
  });
}

export function useUpdateIndustry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: number;
      patch: Partial<Pick<Industry, 'label_ar' | 'label_en' | 'is_active' | 'sort_order'>>;
    }) => industriesApi.updateIndustry(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: SETTINGS_QUERY_KEYS.allIndustries() });
      const previous = queryClient.getQueryData<Industry[]>(
        SETTINGS_QUERY_KEYS.allIndustries()
      );
      if (previous) {
        queryClient.setQueryData(
          SETTINGS_QUERY_KEYS.allIndustries(),
          previous.map((ind) => (ind.id === id ? { ...ind, ...patch } : ind))
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SETTINGS_QUERY_KEYS.allIndustries(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEYS.allIndustries() });
      queryClient.invalidateQueries({ queryKey: qk.industries() });
    },
  });
}

export function useReorderIndustries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orders: { id: number; sort_order: number }[]) =>
      industriesApi.reorderIndustries(orders),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEYS.allIndustries() });
      queryClient.invalidateQueries({ queryKey: qk.industries() });
    },
  });
}

export function useDeleteIndustry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => industriesApi.deleteIndustry(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEYS.allIndustries() });
      queryClient.invalidateQueries({ queryKey: qk.industries() });
    },
  });
}
