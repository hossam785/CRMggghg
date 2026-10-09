'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { type Lead } from '@/types/database';
import { pipelineApi } from './api';
import { type LeadAction } from './stages';
import { applyActionOptimistic, type LeadPipelineFields } from './optimistic';
import {
  snapshotQueries,
  restoreQueries,
  patchLeadEverywhere,
  type QuerySnapshot,
} from '@/lib/cache-patch';
import { invalidate } from '@/lib/invalidate';
import { toAppError } from '@/lib/errors';
import { useUndo } from './use-undo';
import { recordLastAction } from './last-action-store';
import { DEFAULT_SETTINGS, type SettingsRow } from '@/features/settings/api';
import { qk } from '@/lib/query-keys';

export interface ExecuteActionParams<T extends LeadPipelineFields = LeadPipelineFields> {
  lead: T;
  action: LeadAction;
  payload?: Record<string, unknown>;
}

export interface LeadActionContext {
  snapshot: QuerySnapshot;
}

/**
 * Primary React Query hook for atomic pipeline actions with:
 * - Immediate optimistic cache patching across detail, infinite lists, and follow-ups (<16ms)
 * - Automatic rollback on error with user-facing translated toast
 * - 6-second Toast with Undo button
 * - In-flight disabled state (isPending)
 * - Module-level session recording for global Ctrl/⌘+Z shortcut
 */
export function useLeadAction() {
  const qc = useQueryClient();
  const t = useTranslations();
  const undo = useUndo();

  return useMutation<{ lead: Lead; event_id: number }, Error, ExecuteActionParams, LeadActionContext>({
    mutationFn: async (params) => {
      // Check if lead was already optimistically moved to a newer stage
      const cachedDetail = qc.getQueryData<LeadPipelineFields>(qk.lead(params.lead.id));
      const expectedStage = cachedDetail?.stage ?? params.lead.stage;

      return pipelineApi.leadAction({
        leadId: params.lead.id,
        action: params.action,
        payload: params.payload,
        expectedStage,
      });
    },

    onMutate: async (params) => {
      // 1. Cancel in-flight queries that might overwrite our optimistic update
      await Promise.all([
        qc.cancelQueries({ queryKey: ['leads'] }),
        qc.cancelQueries({ queryKey: ['lead', params.lead.id] }),
        qc.cancelQueries({ queryKey: ['follow-ups'] }),
      ]);

      // 2. Snapshot current state across lists, detail, and follow-ups
      const snapshot = snapshotQueries(qc, [
        ['leads'],
        ['lead', params.lead.id],
        ['follow-ups'],
      ]);

      // 3. Obtain user settings or fallback to defaults
      const settings = qc.getQueryData<SettingsRow>(qk.settings()) ?? DEFAULT_SETTINGS;

      // 4. Calculate calendar day today in user's configured timezone
      const tz = settings.timezone || 'Africa/Cairo';
      let todayStr: string;
      try {
        todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
      } catch {
        todayStr = new Date().toISOString().split('T')[0] ?? '2026-10-09';
      }

      // 5. Apply optimistic transformations exactly matching 0005_pipeline.sql
      const nextLead = applyActionOptimistic(
        params.lead,
        params.action,
        params.payload,
        settings,
        todayStr
      );

      // 6. Patch cache everywhere
      patchLeadEverywhere(qc, params.lead.id, nextLead);

      return { snapshot };
    },

    onError: (err, params, context) => {
      // Rollback cache to pre-mutation snapshot
      if (context?.snapshot) {
        restoreQueries(qc, context.snapshot);
      }

      const appErr = toAppError(err);
      toast.error(t(appErr.messageKey as Parameters<typeof t>[0]));

      if (appErr.code === 'STAGE_CONFLICT') {
        void invalidate.afterLeadAction(qc, params.lead.id);
      }
    },

    onSuccess: (res, params) => {
      // Record event in session store for global Ctrl/⌘+Z shortcut
      recordLastAction({
        eventId: res.event_id,
        leadId: params.lead.id,
        action: params.action,
        leadName: (params.lead as { name?: string }).name || '',
      });

      // Patch cache with authoritative server-returned lead
      patchLeadEverywhere(qc, params.lead.id, res.lead);

      // Toast with 6-second Undo action button
      const leadName = (params.lead as { name?: string }).name || '';
      const doneKey = `actions.done.${params.action}`;

      toast.success(t(doneKey as Parameters<typeof t>[0], { name: leadName }), {
        duration: 6000,
        action: {
          label: t('common.undo'),
          onClick: () => {
            undo.mutate(res.event_id);
          },
        },
      });
    },

    onSettled: (_data, _err, params) => {
      if (params) {
        void invalidate.afterLeadAction(qc, params.lead.id);
      }
    },
  });
}
