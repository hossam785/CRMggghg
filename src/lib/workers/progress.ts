import * as Comlink from 'comlink';

export interface WorkerProgress {
  processed: number;
  total: number;
  percent: number;
  message?: string;
}

export type ProgressCallback = (progress: WorkerProgress) => void;

/**
 * Creates a throttled progress callback suitable for Comlink worker communication.
 * Throttles invocations to once every minIntervalMs (default 100ms) to prevent UI thread lock.
 */
export function createThrottledProgress(
  onProgress: ProgressCallback,
  minIntervalMs: number = 100
): ProgressCallback {
  let lastTime = 0;
  let lastProgress: WorkerProgress | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const flush = (progress: WorkerProgress) => {
    lastTime = Date.now();
    lastProgress = progress;
    onProgress(progress);
  };

  return (progress: WorkerProgress) => {
    const now = Date.now();

    // If finished or 0%, flush immediately
    if (progress.percent === 0 || progress.percent >= 100 || progress.processed >= progress.total) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      flush(progress);
      return;
    }

    if (now - lastTime >= minIntervalMs) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      flush(progress);
    } else {
      lastProgress = progress;
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          timeoutId = null;
          if (lastProgress) flush(lastProgress);
        }, minIntervalMs - (now - lastTime));
      }
    }
  };
}

/**
 * Wraps progress callback with Comlink.proxy so the worker can invoke it.
 */
export function wrapProgressCallback(onProgress: ProgressCallback): ProgressCallback {
  return Comlink.proxy(onProgress);
}
