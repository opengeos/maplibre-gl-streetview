import { LngLat, type LngLatLike } from 'maplibre-gl';
import { Viewer as MapillaryViewer } from 'mapillary-js';
import { BaseProvider } from './BaseProvider';
import type { ImageryResult, ViewState, ProviderType } from '../core/types';
import { MAPILLARY_API, MAPILLARY_IMAGE_FIELDS } from '../core/constants';
import { toLngLat, createBbox, bboxToString, findClosestPoint } from '../utils/geo';
import { buildUrl, fetchJson, type MapillaryImageResponse, type MapillaryImage } from '../utils/api';

/**
 * Mapillary provider using the MapillaryJS viewer.
 * Displays crowdsourced street-level imagery with 360° navigation.
 */
export class MapillaryProvider extends BaseProvider {
  readonly name: ProviderType = 'mapillary';
  readonly displayName = 'Mapillary';

  private _accessToken: string;
  private _viewer: MapillaryViewer | null = null;
  private _viewerContainer: HTMLElement | null = null;

  /**
   * Creates a new Mapillary provider.
   *
   * @param accessToken - Mapillary access token
   */
  constructor(accessToken: string) {
    super();
    this._accessToken = accessToken;
  }

  /**
   * Check if the access token is configured.
   */
  isConfigured(): boolean {
    return Boolean(this._accessToken);
  }

  /**
   * Query for Mapillary imagery at a location.
   *
   * @param lngLat - The location to query
   * @param radius - Search radius in meters (default: 50)
   * @returns The closest imagery result or null
   */
  async queryImagery(lngLat: LngLatLike, radius = 50): Promise<ImageryResult | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const point = toLngLat(lngLat);
    const bbox = createBbox(point, radius);

    try {
      const url = buildUrl(`${MAPILLARY_API.GRAPH_URL}${MAPILLARY_API.IMAGES_ENDPOINT}`, {
        access_token: this._accessToken,
        bbox: bboxToString(bbox),
        fields: MAPILLARY_IMAGE_FIELDS,
        limit: 100,
      });

      const response = await fetchJson<MapillaryImageResponse>(url);

      if (!response.data || response.data.length === 0) {
        return null;
      }

      // Convert to imagery results and find closest
      const imageryResults = response.data
        .filter((img): img is MapillaryImage & { computed_geometry: NonNullable<MapillaryImage['computed_geometry']> } =>
          Boolean(img.computed_geometry)
        )
        .map(img => this.mapillaryToImagery(img));

      return findClosestPoint(point, imageryResults);
    } catch (error) {
      console.error('Mapillary query failed:', error);
      return null;
    }
  }

  /**
   * Find nearest Mapillary imagery within a maximum radius.
   * Progressively searches with increasing radii.
   *
   * @param lngLat - The target location
   * @param maxRadius - Maximum search radius in meters (default: 100)
   * @returns The nearest imagery or null
   */
  async findNearestImagery(lngLat: LngLatLike, maxRadius = 100): Promise<ImageryResult | null> {
    // Mapillary bbox can be larger, so use fewer iterations
    const radii = [50, 100, 250, 500].filter(r => r <= maxRadius || r === 50);

    for (const radius of radii) {
      if (radius > maxRadius) break;
      const result = await this.queryImagery(lngLat, radius);
      if (result) return result;
    }

    return null;
  }

  /**
   * Convert Mapillary API response to ImageryResult.
   */
  private mapillaryToImagery(image: MapillaryImage & { computed_geometry: NonNullable<MapillaryImage['computed_geometry']> }): ImageryResult {
    const [lng, lat] = image.computed_geometry.coordinates;
    return {
      id: image.id,
      location: new LngLat(lng, lat),
      provider: 'mapillary',
      thumbnailUrl: image.thumb_256_url || image.thumb_1024_url,
      capturedAt: image.captured_at ? new Date(image.captured_at) : undefined,
      heading: image.compass_angle,
      isPano: image.is_pano,
    };
  }

  /**
   * Render Mapillary viewer in a container.
   *
   * @param container - The container element
   * @param imagery - The imagery to display
   */
  render(container: HTMLElement, imagery: ImageryResult): void {
    this._container = container;

    // Clean up existing viewer
    this.destroy();

    // Create viewer container
    this._viewerContainer = document.createElement('div');
    this._viewerContainer.className = 'mapillary-viewer';
    this._viewerContainer.style.width = '100%';
    this._viewerContainer.style.height = '100%';
    container.appendChild(this._viewerContainer);

    // Initialize MapillaryJS viewer
    this._viewer = new MapillaryViewer({
      accessToken: this._accessToken,
      container: this._viewerContainer,
      imageId: imagery.id,
    });

    // Subscribe to bearing changes (when user rotates the view)
    this._viewer.on('bearing', (event) => {
      this.emitHeadingChange(event.bearing);
    });

    // Subscribe to image changes (when user navigates to a different image)
    this._viewer.on('image', (event) => {
      const image = event.image;
      if (image) {
        // Get position from image
        const lngLat = image.lngLat;
        if (lngLat) {
          this.emitLocationChange(new LngLat(lngLat.lng, lngLat.lat));
        }
        // Get the current view bearing after image loads
        this._viewer?.getBearing().then((bearing) => {
          this.emitHeadingChange(bearing);
        }).catch(() => {
          // Fallback to compass angle if bearing not available
          const compassAngle = image.compassAngle;
          if (compassAngle !== undefined) {
            this.emitHeadingChange(compassAngle);
          }
        });
      }
    });

    // Emit initial heading if available
    if (imagery.heading !== undefined) {
      this.emitHeadingChange(imagery.heading);
    }
  }

  /**
   * Navigate to a specific image.
   *
   * @param imageId - The Mapillary image ID
   */
  async navigateToImage(imageId: string): Promise<void> {
    if (!this._viewer) return;

    try {
      await this._viewer.moveTo(imageId);
    } catch (error) {
      console.error('Failed to navigate to image:', error);
    }
  }

  /**
   * Clean up the MapillaryJS viewer.
   */
  destroy(): void {
    if (this._viewer) {
      this._viewer.remove();
      this._viewer = null;
    }
    if (this._viewerContainer) {
      this._viewerContainer.remove();
      this._viewerContainer = null;
    }
    this._container = null;
    this._headingCallbacks.clear();
  }

  /**
   * Get the current view state from the viewer.
   * Note: This is synchronous but may return stale data.
   */
  getViewState(): ViewState | null {
    if (!this._viewer) return null;

    // Return cached heading since getPointOfView is async
    return {
      heading: this._currentHeading,
      pitch: 0,
      zoom: 1,
    };
  }

  /**
   * Set the view bearing/heading.
   *
   * @param heading - The heading (0-360)
   */
  async setHeading(heading: number): Promise<void> {
    if (!this._viewer) return;

    try {
      await this._viewer.setCenter([heading, 0]);
    } catch (error) {
      console.error('Failed to set heading:', error);
    }
  }

  /**
   * Get the underlying MapillaryJS viewer instance.
   */
  getViewer(): MapillaryViewer | null {
    return this._viewer;
  }
}
