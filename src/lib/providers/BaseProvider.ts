import type { LngLatLike } from 'maplibre-gl';
import type { ProviderType, ImageryResult, ViewState, IStreetViewProvider } from '../core/types';

/**
 * Abstract base class for street view providers.
 * Provides common functionality and defines the interface that all providers must implement.
 */
export abstract class BaseProvider implements IStreetViewProvider {
  abstract readonly name: ProviderType;
  abstract readonly displayName: string;

  protected _container: HTMLElement | null = null;
  protected _headingCallbacks: Set<(heading: number) => void> = new Set();
  protected _currentHeading = 0;

  /**
   * Check if the provider is configured with necessary credentials.
   */
  abstract isConfigured(): boolean;

  /**
   * Query for imagery at a specific location.
   *
   * @param lngLat - The location to query
   * @param radius - Optional search radius in meters
   * @returns The imagery result or null if none found
   */
  abstract queryImagery(lngLat: LngLatLike, radius?: number): Promise<ImageryResult | null>;

  /**
   * Find the nearest available imagery to a location.
   *
   * @param lngLat - The target location
   * @param maxRadius - Maximum search radius in meters
   * @returns The nearest imagery result or null if none found
   */
  abstract findNearestImagery(lngLat: LngLatLike, maxRadius?: number): Promise<ImageryResult | null>;

  /**
   * Render the street view imagery in a container.
   *
   * @param container - The DOM element to render into
   * @param imagery - The imagery to display
   */
  abstract render(container: HTMLElement, imagery: ImageryResult): void;

  /**
   * Clean up the viewer and release resources.
   */
  abstract destroy(): void;

  /**
   * Get the current view state (heading, pitch, zoom).
   *
   * @returns The current view state or null if not available
   */
  abstract getViewState(): ViewState | null;

  /**
   * Subscribe to heading change events.
   *
   * @param callback - Function to call when heading changes
   */
  onHeadingChange(callback: (heading: number) => void): void {
    this._headingCallbacks.add(callback);
  }

  /**
   * Unsubscribe from heading change events.
   *
   * @param callback - The callback to remove
   */
  offHeadingChange(callback: (heading: number) => void): void {
    this._headingCallbacks.delete(callback);
  }

  /**
   * Emit a heading change to all subscribers.
   *
   * @param heading - The new heading value
   */
  protected emitHeadingChange(heading: number): void {
    this._currentHeading = heading;
    for (const callback of this._headingCallbacks) {
      callback(heading);
    }
  }

  /**
   * Get the current container element.
   */
  getContainer(): HTMLElement | null {
    return this._container;
  }
}
