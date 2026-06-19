/**
 * Error thrown when an HTTP request returns a non-2xx response.
 *
 * Carries the status code and (when the body is readable) the parsed response
 * payload so callers can tell an authentication rejection apart from a genuine
 * "no imagery here" result. Providers swallow some failures as "no coverage",
 * so this extra context is what lets them avoid mislabelling a rejected API key.
 */
export class ApiError extends Error {
  /** HTTP status code of the failed response. */
  readonly status: number;

  /** Parsed response body (JSON when parseable, otherwise the raw text). */
  readonly body?: unknown;

  /**
   * Creates a new ApiError.
   *
   * @param status - HTTP status code
   * @param message - Human-readable error message
   * @param body - Parsed response body, if any
   */
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Extracts a human-readable message from a parsed error body.
 * Handles the Mapillary/Graph (`error.message`) and Google
 * (`error_message`) shapes, falling back to a generic `message`.
 *
 * @param body - The parsed response body
 * @returns The provider-supplied message, or undefined
 */
export function extractApiErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const record = body as Record<string, unknown>;
  const nestedError = record.error;
  if (nestedError && typeof nestedError === 'object') {
    const message = (nestedError as Record<string, unknown>).message;
    if (typeof message === 'string' && message) return message;
  }
  if (typeof record.error_message === 'string' && record.error_message) {
    return record.error_message;
  }
  if (typeof record.message === 'string' && record.message) return record.message;
  return undefined;
}

/**
 * Makes a fetch request with error handling.
 *
 * On a non-2xx response this throws an {@link ApiError} that carries the status
 * code and parsed body, rather than a plain Error, so callers can distinguish
 * authentication failures from other problems.
 *
 * @param url - The URL to fetch
 * @param options - Optional fetch options
 * @returns The response data
 */
export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    let body: unknown;
    let detail = '';
    try {
      const text = await response.text();
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
        const apiMessage = extractApiErrorMessage(body);
        if (apiMessage) detail = `: ${apiMessage}`;
      }
    } catch {
      // Ignore body-read failures; the status code alone is still useful.
    }
    throw new ApiError(response.status, `HTTP ${response.status}${detail}`, body);
  }

  return response.json() as Promise<T>;
}

/**
 * Builds a URL with query parameters.
 *
 * @param baseUrl - The base URL
 * @param params - Query parameters
 * @returns The full URL with query string
 */
export function buildUrl(baseUrl: string, params: Record<string, string | number | boolean>): string {
  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

/**
 * Mapillary API response types.
 */
export interface MapillaryImageResponse {
  data: MapillaryImage[];
}

export interface MapillaryImage {
  id: string;
  computed_geometry?: {
    type: 'Point';
    coordinates: [number, number];
  };
  thumb_1024_url?: string;
  thumb_256_url?: string;
  captured_at?: number;
  compass_angle?: number;
  is_pano?: boolean;
}

/**
 * Google Street View metadata response.
 */
export interface GoogleStreetViewMetadata {
  status: 'OK' | 'ZERO_RESULTS' | 'NOT_FOUND' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
  /** Human-readable detail returned by Google for error statuses (e.g. REQUEST_DENIED). */
  error_message?: string;
  copyright?: string;
  date?: string;
  location?: {
    lat: number;
    lng: number;
  };
  pano_id?: string;
}
