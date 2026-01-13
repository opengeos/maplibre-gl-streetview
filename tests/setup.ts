import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test (for React component tests)
afterEach(() => {
  cleanup();
});

// Mock MapLibre GL
vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn(),
    NavigationControl: vi.fn(),
    FullscreenControl: vi.fn(),
    Marker: vi.fn().mockImplementation(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn().mockReturnThis(),
      getElement: vi.fn().mockReturnValue(document.createElement('div')),
    })),
  },
  Map: vi.fn(),
  LngLat: vi.fn().mockImplementation((lng, lat) => ({ lng, lat })),
  Marker: vi.fn().mockImplementation(() => ({
    setLngLat: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
    getElement: vi.fn().mockReturnValue(document.createElement('div')),
  })),
}));

// Mock mapillary-js
vi.mock('mapillary-js', () => ({
  Viewer: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    off: vi.fn(),
    remove: vi.fn(),
    moveTo: vi.fn().mockResolvedValue(undefined),
    getPointOfView: vi.fn().mockReturnValue({ bearing: 0, tilt: 0, zoom: 1 }),
    setPointOfView: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock fetch
global.fetch = vi.fn();
