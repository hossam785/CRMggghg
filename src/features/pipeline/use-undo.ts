'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { pipelineApi } from './api';
import { patchLeadEverywhere } from '@/lib/cache-patch';
import { invalidate } from '@/lib/invalidate';
import { toAppError } from '@/lib/errors';
import { getLastAction, clearLastAction } from './last-action-store';

export function useUndo() {
  const qc = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: (eventId: number) => pipelineApi.undoLeadEvent(eventId),
    onSuccess: (res) => {
      clearLastAction();
      patchLeadEverywhere(qc, res.lead.id, res.lead);
      void invalidate.afterLeadAction(qc, res.lead.id);
      toast.success(
        t('common.save') === 'حفظ'
          ? 'تم التراجع عن الإجراء بنجاح'
          : 'Action undone successfully'
      );
    },
    onError: (err: unknown) => {
      const appErr = toAppError(err);
      if (appErr.code === 'UNDO_EXPIRED') {
        toast.error(t('errors.UNDO_EXPIRED'));
      } else if (appErr.code === 'UNDO_NOT_LATEST') {
        toast.error(t('errors.UNDO_NOT_LATEST'));
      } else {
        toast.error(t('errors.UNKNOWN'));
      }
    },
  });
}

/**
 * Global keyboard listener hook for Ctrl/⌘+Z session-level undo.
 */
export function useGlobalUndoShortcut() {
  const undo = useUndo();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }

        const lastAction = getLastAction();
        if (lastAction && !undo.isPending) {
          e.preventDefault();
          undo.mutate(lastAction.eventId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);
}
