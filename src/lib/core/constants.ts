import type { StreetViewControlOptions, MarkerOptions } from './types';

/**
 * Default marker options.
 */
export const DEFAULT_MARKER_OPTIONS: Required<MarkerOptions> = {
  color: '#ff5722',
  showDirection: true,
  directionColor: '#1976d2',
};

/**
 * Default control options.
 */
export const DEFAULT_OPTIONS: Required<Omit<StreetViewControlOptions, 'googleApiKey' | 'mapillaryAccessToken' | 'className'>> & {
  googleApiKey: string;
  mapillaryAccessToken: string;
  className: string;
} = {
  collapsed: true,
  position: 'top-right',
  title: 'Street View',
  panelWidth: 400,
  panelHeight: 300,
  minPanelWidth: 300,
  minPanelHeight: 200,
  defaultProvider: 'google',
  googleApiKey: '',
  mapillaryAccessToken: '',
  className: '',
  maxSearchRadius: 100,
  clickToView: true,
  showMarker: true,
  markerOptions: DEFAULT_MARKER_OPTIONS,
};

/**
 * Google Street View API endpoints.
 */
export const GOOGLE_API = {
  EMBED_URL: 'https://www.google.com/maps/embed/v1/streetview',
  STATIC_URL: 'https://maps.googleapis.com/maps/api/streetview',
  METADATA_URL: 'https://maps.googleapis.com/maps/api/streetview/metadata',
};

/**
 * Mapillary API endpoints.
 */
export const MAPILLARY_API = {
  GRAPH_URL: 'https://graph.mapillary.com',
  IMAGES_ENDPOINT: '/images',
};

/**
 * Default field list for Mapillary image queries.
 */
export const MAPILLARY_IMAGE_FIELDS = [
  'id',
  'computed_geometry',
  'thumb_1024_url',
  'thumb_256_url',
  'captured_at',
  'compass_angle',
  'is_pano',
].join(',');

/**
 * CSS class names used by the control.
 */
export const CSS_CLASSES = {
  CONTROL: 'streetview-control',
  TOGGLE: 'streetview-control-toggle',
  ICON: 'streetview-control-icon',
  PANEL: 'streetview-panel',
  PANEL_EXPANDED: 'expanded',
  PANEL_HEADER: 'streetview-panel-header',
  PANEL_TITLE: 'streetview-panel-title',
  PANEL_CLOSE: 'streetview-panel-close',
  PANEL_CONTENT: 'streetview-panel-content',
  PANEL_RESIZE: 'streetview-panel-resize',
  PROVIDER_TABS: 'streetview-provider-tabs',
  PROVIDER_TAB: 'streetview-provider-tab',
  PROVIDER_TAB_ACTIVE: 'active',
  VIEWER: 'streetview-viewer',
  VIEWER_LOADING: 'streetview-viewer-loading',
  SPINNER: 'streetview-spinner',
  NO_DATA: 'streetview-no-data',
  NO_DATA_ICON: 'streetview-no-data-icon',
  NO_DATA_TITLE: 'streetview-no-data-title',
  NO_DATA_MESSAGE: 'streetview-no-data-message',
  NO_DATA_ACTION: 'streetview-no-data-action',
  NO_DATA_BUTTON: 'streetview-no-data-button',
  MARKER: 'streetview-marker',
  MARKER_DOT: 'streetview-marker-dot',
  MARKER_DIRECTION: 'streetview-marker-direction',
};
