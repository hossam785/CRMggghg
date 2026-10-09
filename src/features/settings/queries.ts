'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { settingsApi, DEFAULT_SETTINGS, type SettingsRow } from './api';

export function useSettings() {
  return useQuery({
    queryKey: qk.settings(),
    queryFn: ({ signal }) => settingsApi.getSettings(signal),
    staleTime: 1000 * 60 * 60,
    initialData: DEFAULT_SETTINGS,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<SettingsRow>) => settingsApi.updateSettings(patch),
    onSuccess: (data) => {
      queryClient.setQueryData(qk.settings(), data);
    },
  });
}
