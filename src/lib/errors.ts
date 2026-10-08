import * as Sentry from '@sentry/nextjs';

export const APP_ERROR_CODES = [
  'LEAD_NOT_FOUND',
  'INVALID_TRANSITION',
  'STAGE_CONFLICT',
  'UNDO_EXPIRED',
  'UNDO_NOT_LATEST',
  'DUPLICATE_INSTAGRAM',
  'DUPLICATE_WHATSAPP',
  'VALIDATION',
  'UNAUTHORIZED',
  'NETWORK',
  'RATE_LIMITED',
  'IMPORT_TOO_LARGE',
  'IMPORT_UNREADABLE',
  'BACKUP_INVALID',
  'UNKNOWN',
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly messageKey: string;
  override readonly cause?: unknown;

  constructor(code: AppErrorCode, options?: { message?: string; cause?: unknown }) {
    super(options?.message ?? code);
    this.name = 'AppError';
    this.code = code;
    this.messageKey = `errors.${code}`;
    this.cause = options?.cause;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

interface ErrorLike {
  code?: string | number;
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
  name?: string;
}

/**
 * Maps any runtime error (PostgrestError, AuthError, Network error, etc.) to a typed AppError.
 * Only UNKNOWN errors trigger Sentry.captureException.
 */
export function toAppError(e: unknown): AppError {
  if (e instanceof AppError) {
    return e;
  }

  if (typeof e === 'object' && e !== null) {
    const err = e as ErrorLike;
    const msg = typeof err.message === 'string' ? err.message : '';
    const details = typeof err.details === 'string' ? err.details : '';
    const code = String(err.code ?? '');
    const status = err.status;

    // 1) RPC Custom errors
    if (msg.includes('STAGE_CONFLICT')) {
      return new AppError('STAGE_CONFLICT', { cause: e });
    }
    if (msg.includes('LEAD_NOT_FOUND') || code === 'P0002') {
      return new AppError('LEAD_NOT_FOUND', { cause: e });
    }
    if (msg.includes('INVALID_TRANSITION')) {
      return new AppError('INVALID_TRANSITION', { cause: e });
    }
    if (msg.includes('UNDO_EXPIRED')) {
      return new AppError('UNDO_EXPIRED', { cause: e });
    }
    if (msg.includes('UNDO_NOT_LATEST')) {
      return new AppError('UNDO_NOT_LATEST', { cause: e });
    }

    // 2) Postgres unique constraints (23505)
    if (code === '23505') {
      const combined = `${msg} ${details}`.toLowerCase();
      if (combined.includes('leads_ig_unique') || combined.includes('instagram')) {
        return new AppError('DUPLICATE_INSTAGRAM', { cause: e });
      }
      if (combined.includes('leads_wa_unique') || combined.includes('whatsapp')) {
        return new AppError('DUPLICATE_WHATSAPP', { cause: e });
      }
    }

    // 3) Postgres check violation (23514) / Zod validation
    if (code === '23514' || err.name === 'ZodError') {
      return new AppError('VALIDATION', { cause: e });
    }

    // 4) Auth & Unauthorized (401 / PGRST301)
    if (
      code === 'PGRST301' ||
      status === 401 ||
      (status === 400 &&
        (msg.toLowerCase().includes('invalid') ||
          msg.toLowerCase().includes('credentials') ||
          msg.toLowerCase().includes('token')))
    ) {
      return new AppError('UNAUTHORIZED', { cause: e });
    }

    // 5) Rate limiting (429)
    if (status === 429 || code === '429' || msg.includes('429')) {
      return new AppError('RATE_LIMITED', { cause: e });
    }

    // 6) Network errors
    if (
      err.name === 'TypeError' &&
      (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network'))
    ) {
      return new AppError('NETWORK', { cause: e });
    }

    // Check if error explicitly has an AppErrorCode in its code property
    if (APP_ERROR_CODES.includes(code as AppErrorCode)) {
      return new AppError(code as AppErrorCode, { cause: e });
    }
  }

  // 7) UNKNOWN error — capture in Sentry and return UNKNOWN AppError
  try {
    Sentry.captureException(e);
  } catch {
    // Sentry capture failsafe
  }

  return new AppError('UNKNOWN', { cause: e });
}
