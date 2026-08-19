import { HttpErrorResponse } from '@angular/common/http';

export interface ApiErrorBody {
  code?: string;
  message?: string;
  title?: string;
  detail?: string;
  errors?: string[] | null;
}

export interface ResolvedApiError {
  code: string | null;
  message: string;
}

/** Read the unified NileChain `{ code, message, errors }` envelope safely. */
export function readApiErrorBody(err: unknown): ApiErrorBody | null {
  if (!(err instanceof HttpErrorResponse)) {
    const loose = err as { error?: unknown } | null;
    if (loose?.error && typeof loose.error === 'object') {
      return loose.error as ApiErrorBody;
    }
    if (typeof loose?.error === 'string' && loose.error.trim()) {
      return { message: loose.error };
    }
    return null;
  }

  if (typeof err.error === 'string' && err.error.trim()) {
    return { message: err.error };
  }
  if (err.error && typeof err.error === 'object') {
    return err.error as ApiErrorBody;
  }
  return null;
}

export function readApiErrorCode(err: unknown): string | null {
  const body = readApiErrorBody(err);
  return typeof body?.code === 'string' && body.code.trim()
    ? body.code
    : null;
}

/**
 * Prefer API message, then known status fallbacks via i18n.
 * Pass `mapCode` to translate business codes (wallet, dispute, …) first.
 */
export function resolveApiErrorMessage(
  err: unknown,
  i18n: { instant: (key: string, params?: Record<string, string | number>) => string },
  options?: {
    fallbackKey?: string;
    mapCode?: (code: string) => string | null;
  }
): ResolvedApiError {
  const body = readApiErrorBody(err);
  const code = typeof body?.code === 'string' ? body.code : null;
  const status =
    err instanceof HttpErrorResponse
      ? err.status
      : (err as { status?: number } | null)?.status;

  if (code && options?.mapCode) {
    const mapped = options.mapCode(code);
    if (mapped) {
      return { code, message: mapped };
    }
  }

  const apiMessage =
    (typeof body?.message === 'string' && body.message.trim()) ||
    (typeof body?.detail === 'string' && body.detail.trim()) ||
    (typeof body?.title === 'string' && body.title.trim()) ||
    null;

  if (apiMessage) {
    return { code, message: apiMessage };
  }

  if (status === 403) {
    return {
      code: code ?? 'Forbidden',
      message: i18n.instant('contractSign.forbidden'),
    };
  }
  if (status === 409) {
    return {
      code: code ?? 'Conflict',
      message: i18n.instant('contractSign.conflict'),
    };
  }
  if (status === 0) {
    return {
      code: 'Network',
      message: i18n.instant('contractSign.networkError'),
    };
  }

  return {
    code,
    message: i18n.instant(options?.fallbackKey ?? 'common.errorBody'),
  };
}

export function isSubscriptionPaywallError(err: unknown): boolean {
  const code = readApiErrorCode(err) ?? '';
  return code === 'Subscription.QuotaExceeded' || code === 'Subscription.PlanRequired';
}
