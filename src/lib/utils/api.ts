/**
 * Makes a fetch request with error handling.
 *
 * @param url - The URL to fetch
 * @param options - Optional fetch options
 * @returns The response data
 */
export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
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
  copyright?: string;
  date?: string;
  location?: {
    lat: number;
    lng: number;
  };
  pano_id?: string;
}
