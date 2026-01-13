import type { Map as MapLibreMap, LngLat, LngLatLike } from 'maplibre-gl';

/**
 * Street view provider types.
 */
export type ProviderType = 'google' | 'mapillary';

/**
 * Control position on the map.
 */
export type ControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Options for configuring the StreetViewControl.
 */
export interface StreetViewControlOptions {
  /** Whether the control panel should start collapsed. Default: true */
  collapsed?: boolean;

  /** Position of the control on the map. Default: 'top-right' */
  position?: ControlPosition;

  /** Title displayed in the control header. Default: 'Street View' */
  title?: string;

  /** Width of the control panel in pixels. Default: 400 */
  panelWidth?: number;

  /** Height of the control panel in pixels. Default: 300 */
  panelHeight?: number;

  /** Minimum panel width in pixels. Default: 300 */
  minPanelWidth?: number;

  /** Minimum panel height in pixels. Default: 200 */
  minPanelHeight?: number;

  /** Default provider to use. Default: 'google' */
  defaultProvider?: ProviderType;

  /** Google Maps API key */
  googleApiKey?: string;

  /** Mapillary access token */
  mapillaryAccessToken?: string;

  /** Custom CSS class name */
  className?: string;

  /** Maximum search radius for nearest imagery (meters). Default: 100 */
  maxSearchRadius?: number;

  /** Enable click-to-view on map. Default: true */
  clickToView?: boolean;

  /** Show marker at street view location. Default: true */
  showMarker?: boolean;

  /** Marker options */
  markerOptions?: MarkerOptions;
}

/**
 * Marker customization options.
 */
export interface MarkerOptions {
  /** Marker color. Default: '#ff5722' */
  color?: string;

  /** Show direction indicator. Default: true */
  showDirection?: boolean;

  /** Direction indicator color. Default: '#1976d2' */
  directionColor?: string;
}

/**
 * Internal state of the street view control.
 */
export interface StreetViewState {
  /** Whether the control panel is collapsed */
  collapsed: boolean;

  /** Currently active provider */
  activeProvider: ProviderType;

  /** Current location being viewed */
  location: LngLat | null;

  /** Current imagery data */
  imagery: ImageryResult | null;

  /** Current view heading (0-360 degrees) */
  heading: number;

  /** Current view pitch (-90 to 90 degrees) */
  pitch: number;

  /** Loading state */
  loading: boolean;

  /** Error message if any */
  error: string | null;
}

/**
 * Result from imagery query.
 */
export interface ImageryResult {
  /** Provider-specific image ID */
  id: string;

  /** Image location */
  location: LngLat;

  /** Capture date (if available) */
  capturedAt?: Date;

  /** Thumbnail URL (if available) */
  thumbnailUrl?: string;

  /** Provider that returned this result */
  provider: ProviderType;

  /** Original compass heading of the image */
  heading?: number;

  /** Whether this is a 360 panorama */
  isPano?: boolean;
}

/**
 * Current view state of the street view viewer.
 */
export interface ViewState {
  /** Current heading (0-360) */
  heading: number;

  /** Current pitch (-90 to 90) */
  pitch: number;

  /** Current zoom level (provider-specific) */
  zoom?: number;
}

/**
 * Bounding box for spatial queries.
 */
export interface BoundingBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

/**
 * Event types emitted by the control.
 */
export type StreetViewEvent =
  | 'collapse'
  | 'expand'
  | 'statechange'
  | 'providerchange'
  | 'locationchange'
  | 'headingchange'
  | 'error'
  | 'load';

/**
 * Event data passed to handlers.
 */
export interface StreetViewEventData {
  type: StreetViewEvent;
  state: StreetViewState;
  error?: Error;
}

/**
 * Event handler function type.
 */
export type StreetViewEventHandler = (event: StreetViewEventData) => void;

/**
 * Props for the React wrapper component.
 */
export interface StreetViewControlReactProps extends StreetViewControlOptions {
  /** MapLibre GL map instance */
  map: MapLibreMap;

  /** Callback fired when the control state changes */
  onStateChange?: (state: StreetViewState) => void;

  /** Callback fired when provider changes */
  onProviderChange?: (provider: ProviderType) => void;

  /** Callback fired when location changes */
  onLocationChange?: (location: LngLat | null) => void;

  /** Callback fired when heading changes */
  onHeadingChange?: (heading: number) => void;

  /** Callback fired on error */
  onError?: (error: Error) => void;
}

/**
 * Configuration for provider availability.
 */
export interface ProviderConfig {
  google: {
    enabled: boolean;
    apiKey: string | null;
  };
  mapillary: {
    enabled: boolean;
    accessToken: string | null;
  };
}

/**
 * Provider interface for street view imagery sources.
 */
export interface IStreetViewProvider {
  /** Provider name identifier */
  readonly name: ProviderType;

  /** Display name for UI */
  readonly displayName: string;

  /** Check if API key/token is configured */
  isConfigured(): boolean;

  /** Query for imagery at a location */
  queryImagery(lngLat: LngLatLike, radius?: number): Promise<ImageryResult | null>;

  /** Find nearest imagery if none at exact location */
  findNearestImagery(lngLat: LngLatLike, maxRadius?: number): Promise<ImageryResult | null>;

  /** Render the viewer into a container */
  render(container: HTMLElement, imagery: ImageryResult): void;

  /** Clean up the viewer */
  destroy(): void;

  /** Get current view state */
  getViewState(): ViewState | null;

  /** Subscribe to heading changes */
  onHeadingChange(callback: (heading: number) => void): void;

  /** Unsubscribe from heading changes */
  offHeadingChange(callback: (heading: number) => void): void;

  /** Subscribe to location changes */
  onLocationChange(callback: (location: LngLat) => void): void;

  /** Unsubscribe from location changes */
  offLocationChange(callback: (location: LngLat) => void): void;
}
