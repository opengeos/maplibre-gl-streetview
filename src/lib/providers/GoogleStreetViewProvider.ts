import { LngLat, type LngLatLike } from 'maplibre-gl';
import { BaseProvider } from './BaseProvider';
import type { ImageryResult, ViewState, ProviderType } from '../core/types';
import { GOOGLE_API } from '../core/constants';
import { toLngLat } from '../utils/geo';
import { buildUrl, fetchJson, type GoogleStreetViewMetadata } from '../utils/api';

/**
 * Google Street View provider using the Embed API.
 * Displays interactive 360° panoramas in an iframe.
 */
export class GoogleStreetViewProvider extends BaseProvider {
  readonly name: ProviderType = 'google';
  readonly displayName = 'Google';

  private _apiKey: string;
  private _iframe: HTMLIFrameElement | null = null;
  private _currentImagery: ImageryResult | null = null;
  private _heading = 0;
  private _pitch = 0;

  /**
   * Creates a new Google Street View provider.
   *
   * @param apiKey - Google Maps API key
   */
  constructor(apiKey: string) {
    super();
    this._apiKey = apiKey;
  }

  /**
   * Check if the API key is configured.
   */
  isConfigured(): boolean {
    return Boolean(this._apiKey);
  }

  /**
   * Query for Street View imagery at a location.
   * Uses the Street View Static API metadata endpoint to check coverage.
   *
   * @param lngLat - The location to query
   * @param radius - Search radius in meters (default: 50)
   * @returns The imagery result or null if no coverage
   */
  async queryImagery(lngLat: LngLatLike, radius = 50): Promise<ImageryResult | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const point = toLngLat(lngLat);

    try {
      const url = buildUrl(GOOGLE_API.METADATA_URL, {
        location: `${point.lat},${point.lng}`,
        radius: radius,
        key: this._apiKey,
      });

      const metadata = await fetchJson<GoogleStreetViewMetadata>(url);

      if (metadata.status === 'OK' && metadata.location && metadata.pano_id) {
        return {
          id: metadata.pano_id,
          location: new LngLat(metadata.location.lng, metadata.location.lat),
          provider: 'google',
          capturedAt: metadata.date ? new Date(metadata.date) : undefined,
          isPano: true,
        };
      }

      return null;
    } catch (error) {
      console.error('Google Street View query failed:', error);
      return null;
    }
  }

  /**
   * Find nearest Street View imagery within a maximum radius.
   * Progressively searches with increasing radii.
   *
   * @param lngLat - The target location
   * @param maxRadius - Maximum search radius in meters (default: 100)
   * @returns The nearest imagery or null
   */
  async findNearestImagery(lngLat: LngLatLike, maxRadius = 100): Promise<ImageryResult | null> {
    const radii = [50, 100, 200, 500].filter(r => r <= maxRadius || r === 50);

    for (const radius of radii) {
      if (radius > maxRadius) break;
      const result = await this.queryImagery(lngLat, radius);
      if (result) return result;
    }

    return null;
  }

  /**
   * Render Street View in an iframe.
   *
   * @param container - The container element
   * @param imagery - The imagery to display
   */
  render(container: HTMLElement, imagery: ImageryResult): void {
    this._container = container;
    this._currentImagery = imagery;

    // Remove existing iframe
    if (this._iframe) {
      this._iframe.remove();
    }

    // Create iframe
    this._iframe = document.createElement('iframe');
    this._iframe.style.width = '100%';
    this._iframe.style.height = '100%';
    this._iframe.style.border = 'none';
    this._iframe.setAttribute('allowfullscreen', '');
    this._iframe.setAttribute('loading', 'lazy');
    this._iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');

    // Set the embed URL
    this.updateIframeSrc();

    container.appendChild(this._iframe);
  }

  /**
   * Update the iframe source with current heading/pitch.
   */
  private updateIframeSrc(): void {
    if (!this._iframe || !this._currentImagery) return;

    const params: Record<string, string | number> = {
      key: this._apiKey,
      location: `${this._currentImagery.location.lat},${this._currentImagery.location.lng}`,
    };

    if (this._heading !== 0) {
      params.heading = this._heading;
    }

    if (this._pitch !== 0) {
      params.pitch = this._pitch;
    }

    const url = buildUrl(GOOGLE_API.EMBED_URL, params);
    this._iframe.src = url;
  }

  /**
   * Generate an embed URL for a location.
   *
   * @param location - The location
   * @param heading - View heading
   * @param pitch - View pitch
   * @returns The embed URL
   */
  generateEmbedUrl(location: LngLatLike, heading = 0, pitch = 0): string {
    const point = toLngLat(location);
    const params: Record<string, string | number> = {
      key: this._apiKey,
      location: `${point.lat},${point.lng}`,
    };

    if (heading !== 0) {
      params.heading = heading;
    }

    if (pitch !== 0) {
      params.pitch = pitch;
    }

    return buildUrl(GOOGLE_API.EMBED_URL, params);
  }

  /**
   * Clean up the iframe.
   */
  destroy(): void {
    if (this._iframe) {
      this._iframe.remove();
      this._iframe = null;
    }
    this._container = null;
    this._currentImagery = null;
    this._headingCallbacks.clear();
  }

  /**
   * Get the current view state.
   * Note: With iframe embed, we can't get real-time updates from the viewer.
   */
  getViewState(): ViewState | null {
    return {
      heading: this._heading,
      pitch: this._pitch,
    };
  }

  /**
   * Set the view heading.
   * Note: This will reload the iframe.
   *
   * @param heading - The heading (0-360)
   */
  setHeading(heading: number): void {
    this._heading = heading;
    this.updateIframeSrc();
    this.emitHeadingChange(heading);
  }

  /**
   * Set the view pitch.
   * Note: This will reload the iframe.
   *
   * @param pitch - The pitch (-90 to 90)
   */
  setPitch(pitch: number): void {
    this._pitch = pitch;
    this.updateIframeSrc();
  }
}
