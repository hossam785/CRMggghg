import * as React from 'react';
import * as Comlink from 'comlink';
import { AppError } from '@/lib/errors';

export interface UseWorkerResult<T> {
  api: Comlink.Remote<T> | null;
  cancel: () => void;
  isReady: boolean;
}

/**
 * Creates and wraps a Web Worker with Comlink lazily.
 * Provides termination on unmount, cancel capability, and typed API access.
 */
export function useWorker<T>(
  workerFactory: () => Worker
): UseWorkerResult<T> {
  const [state, setState] = React.useState<{
    worker: Worker | null;
    api: Comlink.Remote<T> | null;
  }>(() => {
    if (typeof window === 'undefined') return { worker: null, api: null };
    try {
      const worker = workerFactory();
      const api = Comlink.wrap<T>(worker);
      return { worker, api };
    } catch {
      return { worker: null, api: null };
    }
  });

  React.useEffect(() => {
    return () => {
      state.worker?.terminate();
    };
  }, [state.worker]);

  const cancel = React.useCallback(() => {
    setState((prev) => {
      prev.worker?.terminate();
      return { worker: null, api: null };
    });
  }, []);

  return {
    api: state.api,
    cancel,
    isReady: !!state.api,
  };
}

/**
 * Imperative worker runner: spawns a fresh worker instance, runs an async operation,
 * exposes cancel(), and terminates worker on finish.
 */
export async function runWithWorker<TWorkerApi, TResult>(
  workerFactory: () => Worker,
  task: (api: Comlink.Remote<TWorkerApi>, checkCancelled: () => boolean) => Promise<TResult>,
  options?: { signal?: AbortSignal }
): Promise<TResult> {
  const worker = workerFactory();
  const api = Comlink.wrap<TWorkerApi>(worker);
  let isCancelled = false;

  const cleanup = () => {
    worker.terminate();
  };

  if (options?.signal) {
    options.signal.addEventListener('abort', () => {
      isCancelled = true;
      cleanup();
    });
  }

  try {
    if (options?.signal?.aborted) {
      throw new AppError('CANCELLED');
    }

    const result = await task(api, () => isCancelled);
    cleanup();
    return result;
  } catch (err) {
    cleanup();
    if (isCancelled || options?.signal?.aborted) {
      throw new AppError('CANCELLED');
    }
    throw err;
  }
}
