import type ar from '../../messages/ar.json';
import type en from '../../messages/en.json';

export type Messages = typeof ar;

type DeepKeysMatch<TExpected, TActual> = {
  [K in keyof TExpected]: K extends keyof TActual
    ? TExpected[K] extends Record<string, unknown>
      ? TActual[K] extends Record<string, unknown>
        ? DeepKeysMatch<TExpected[K], TActual[K]>
        : false
      : true
    : false;
};

type AllTrue<T> = T extends true
  ? true
  : T extends Record<string, unknown>
    ? { [K in keyof T]: AllTrue<T[K]> }[keyof T] extends true
      ? true
      : false
    : false;

export type EnMatchesAr = AllTrue<DeepKeysMatch<typeof ar, typeof en>>;
export type ArMatchesEn = AllTrue<DeepKeysMatch<typeof en, typeof ar>>;

// Compile-time assertion: fails if en.json or ar.json has missing keys
export const _enKeysValid: EnMatchesAr = true;
export const _arKeysValid: ArMatchesEn = true;
