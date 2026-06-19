// Import styles
import './index.css';

// Main entry point - Core exports
export { StreetViewControl } from './lib/core/StreetViewControl';

// Type exports
export type {
  StreetViewControlOptions,
  StreetViewState,
  StreetViewEvent,
  StreetViewEventHandler,
  StreetViewEventData,
  ProviderType,
  ImageryResult,
  ViewState,
  ViewOptions,
  MarkerOptions,
  ControlPosition,
  IStreetViewProvider,
} from './lib/core/types';

// Error exports
export { StreetViewAuthError, isApiAuthError } from './lib/core/errors';
export { ApiError } from './lib/utils/api';

// Provider exports
export { GoogleStreetViewProvider, MapillaryProvider } from './lib/providers';

// Component exports (for advanced usage)
export { StreetViewMarker } from './lib/components';

// Utility exports
export {
  clamp,
  generateId,
  debounce,
  throttle,
  normalizeHeading,
  toLngLat,
  createBbox,
  calculateDistance,
  calculateBearing,
} from './lib/utils';
