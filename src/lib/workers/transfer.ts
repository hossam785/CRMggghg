import * as Comlink from 'comlink';

/**
 * Wraps an ArrayBuffer or Uint8Array as a zero-copy transferable object via Comlink.
 */
export function transferBuffer<T extends ArrayBuffer | Uint8Array>(
  data: T
): T {
  const buffer = data instanceof Uint8Array ? data.buffer : data;
  return Comlink.transfer(data, [buffer as ArrayBuffer]);
}
