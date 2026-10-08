import { supabase } from './client';
import { toAppError } from '@/lib/errors';
import type { Database } from '@/types/database';

type Functions = Database['public']['Functions'];

export type RpcName = keyof Functions;
export type RpcArgs<F extends RpcName> = Functions[F] extends { Args: infer A }
  ? A
  : Record<string, never>;
export type RpcReturns<F extends RpcName> = Functions[F] extends { Returns: infer R }
  ? R
  : unknown;

interface RpcQuery {
  abortSignal(signal: AbortSignal): void;
  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2>;
}

export async function rpc<F extends RpcName>(
  fn: F,
  args: RpcArgs<F>,
  signal?: AbortSignal
): Promise<RpcReturns<F>> {
  const rpcCaller = supabase.rpc as unknown as (
    functionName: string,
    functionArgs: unknown
  ) => RpcQuery;

  const q = rpcCaller(fn as string, args);
  if (signal) {
    q.abortSignal(signal);
  }
  const { data, error } = await q;
  if (error) {
    throw toAppError(error);
  }
  return data as RpcReturns<F>;
}
