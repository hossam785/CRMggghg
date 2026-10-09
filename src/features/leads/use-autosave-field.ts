'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { qk } from '@/lib/query-keys';
import { invalidate } from '@/lib/invalidate';
import { toAppError } from '@/lib/errors';
import { leadsApi } from './api';
import { leadInputSchema, type LeadInput, type Lead } from './schema';
import type { SaveState } from '@/components/ui/save-indicator';

export interface UseAutosaveFieldOptions<K extends keyof LeadInput> {
  leadId: string;
  field: K;
  initialValue: LeadInput[K];
  currentLead?: Lead | null;
  debounceMs?: number;
  onSuccess?: (updatedLead: Lead) => void;
}

export function useAutosaveField<K extends keyof LeadInput>({
  leadId,
  field,
  initialValue,
  currentLead,
  debounceMs = 600,
  onSuccess,
}: UseAutosaveFieldOptions<K>) {
  const queryClient = useQueryClient();
  const t = useTranslations('leads');

  const [value, setValue] = React.useState<LeadInput[K]>(initialValue);
  const [prevInitial, setPrevInitial] = React.useState<LeadInput[K]>(initialValue);
  const [saveState, setSaveState] = React.useState<SaveState>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Sync external changes using React 19 render-time adjustment
  if (initialValue !== prevInitial) {
    setPrevInitial(initialValue);
    setValue(initialValue);
  }

  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const queueRef = React.useRef<Promise<unknown>>(Promise.resolve());
  const pendingValueRef = React.useRef<LeadInput[K]>(value);
  const lastSavedValueRef = React.useRef<LeadInput[K]>(initialValue);

  // Sync ref when value changes (inside effect, outside render)
  React.useEffect(() => {
    pendingValueRef.current = value;
  }, [value]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Beforeunload warning if saving or pending
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveState === 'saving' || pendingValueRef.current !== lastSavedValueRef.current) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveState]);

  // Performs validation and database update in a serial queue
  const commitValue = React.useCallback(
    async (valToCommit: LeadInput[K]) => {
      // 1. If value is identical to last successfully saved value, skip
      if (valToCommit === lastSavedValueRef.current) {
        return;
      }

      // 2. Validate single field schema
      const fieldValidator = leadInputSchema.shape[field];
      const parsed = fieldValidator.safeParse(valToCommit);

      if (!parsed.success) {
        setSaveState('error');
        setErrorMessage(t('required'));
        return;
      }

      // 3. Contact requirement validation: At least Instagram or WhatsApp must remain
      if (field === 'instagram_handle' && !valToCommit) {
        if (!currentLead?.whatsapp_e164) {
          setSaveState('error');
          setErrorMessage(t('contactRequired'));
          return;
        }
      }
      if (field === 'whatsapp_e164' && !valToCommit) {
        if (!currentLead?.instagram_handle) {
          setSaveState('error');
          setErrorMessage(t('contactRequired'));
          return;
        }
      }

      setErrorMessage(null);
      setSaveState('saving');

      // 4. Queue execution sequentially
      queueRef.current = queueRef.current
        .then(async () => {
          // Snapshot for rollback
          const previousLead = queryClient.getQueryData<Lead>(qk.lead(leadId));

          // Optimistic cache update
          queryClient.setQueryData<Lead | undefined>(qk.lead(leadId), (old) => {
            if (!old) return old;
            return {
              ...old,
              [field]: valToCommit,
            };
          });

          try {
            const updated = await leadsApi.updateLead(leadId, {
              [field]: valToCommit,
            });

            lastSavedValueRef.current = valToCommit;
            setSaveState('saved');
            setErrorMessage(null);

            // Invalidate other related caches
            void invalidate.afterLeadEdit(queryClient, leadId);
            onSuccess?.(updated);

            // Revert 'saved' back to 'idle' after 2.5s
            setTimeout(() => {
              setSaveState((cur) => (cur === 'saved' ? 'idle' : cur));
            }, 2500);
          } catch (err) {
            // Rollback optimistic update
            if (previousLead) {
              queryClient.setQueryData(qk.lead(leadId), previousLead);
            }

            const appErr = toAppError(err);
            setSaveState('error');
            if (
              appErr.code === 'DUPLICATE_INSTAGRAM' ||
              appErr.code === 'DUPLICATE_WHATSAPP'
            ) {
              setErrorMessage(t('duplicateWarning'));
            } else {
              setErrorMessage(appErr.messageKey || 'فشل الحفظ');
            }
          }
        })
        .catch(() => {
          setSaveState('error');
        });

      await queueRef.current;
    },
    [field, leadId, currentLead, queryClient, t, onSuccess]
  );

  // Update value and trigger debounced save
  const updateValue = React.useCallback(
    (newValue: LeadInput[K]) => {
      setValue(newValue);
      pendingValueRef.current = newValue;
      setErrorMessage(null);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        void commitValue(newValue);
      }, debounceMs);
    },
    [debounceMs, commitValue]
  );

  // Immediate flush (e.g. on blur or Enter)
  const flush = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    void commitValue(pendingValueRef.current);
  }, [commitValue]);

  // Manual retry if last save failed
  const retry = React.useCallback(() => {
    void commitValue(pendingValueRef.current);
  }, [commitValue]);

  return {
    value,
    setValue: updateValue,
    flush,
    retry,
    saveState,
    errorMessage,
  };
}
