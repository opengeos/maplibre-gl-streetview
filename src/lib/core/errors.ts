import type { ProviderType } from './types';
import { ApiError } from '../utils/api';

/**
 * Error raised when a provider rejects the configured credentials.
 *
 * Providers throw this (instead of returning `null`, which means "no imagery
 * here") so the control can show a clear "check your API key" message rather
 * than a misleading "no coverage" notice. See issues #562 and #563.
 */
export class StreetViewAuthError extends Error {
  /** Provider whose credentials were rejected. */
  readonly provider: ProviderType;

  /** HTTP status code, when the rejection came from an HTTP response. */
  readonly status?: number;

  /**
   * Creates a new StreetViewAuthError.
   *
   * @param provider - The provider that rejected the credentials
   * @param status - Optional HTTP status code from the failed response
   * @param message - Optional underlying error message
   */
  constructor(provider: ProviderType, status?: number, message?: string) {
    super(message ?? `Authentication failed for ${provider}`);
    this.name = 'StreetViewAuthError';
    this.provider = provider;
    this.status = status;
  }
}

/**
 * Determines whether an {@link ApiError} represents an authentication failure.
 *
 * Mapillary (Graph API) does not use 401/403 for a bad access token: it returns
 * HTTP 400 with an `OAuthException` (code 190) in the body. Google's Street View
 * metadata endpoint returns HTTP 200 with `status: 'REQUEST_DENIED'`, which the
 * provider handles separately. This helper therefore checks both the status code
 * and the parsed error payload.
 *
 * @param error - The error to inspect
 * @returns True when the error is an authentication/authorization rejection
 */
export function isApiAuthError(error: unknown): error is ApiError {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 401 || error.status === 403) return true;

  const body = error.body;
  if (body && typeof body === 'object') {
    const nested = (body as Record<string, unknown>).error;
    if (nested && typeof nested === 'object') {
      const record = nested as Record<string, unknown>;
      // Mapillary/Graph OAuth rejections: type 'OAuthException', code 190.
      if (record.type === 'OAuthException') return true;
      if (record.code === 190) return true;
    }
  }
  return false;
}
