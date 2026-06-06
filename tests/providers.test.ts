import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LngLat } from 'maplibre-gl';
import { GoogleStreetViewProvider } from '../src/lib/providers/GoogleStreetViewProvider';
import { MapillaryProvider } from '../src/lib/providers/MapillaryProvider';
import { headingToBasicPoint } from '../src/lib/utils';
import type { ImageryResult } from '../src/lib/core/types';

function createGoogleImagery(): ImageryResult {
  return {
    id: 'pano-1',
    location: new LngLat(-122.4194, 37.7749),
    provider: 'google',
    isPano: true,
  };
}

function createMapillaryImagery(): ImageryResult {
  return {
    id: 'img-1',
    location: new LngLat(-122.4194, 37.7749),
    provider: 'mapillary',
    heading: 45,
    isPano: true,
  };
}

type MockedMapillaryViewer = {
  on: ReturnType<typeof vi.fn>;
  getImage: ReturnType<typeof vi.fn>;
  setCenter: ReturnType<typeof vi.fn>;
};

describe('GoogleStreetViewProvider', () => {
  describe('isConfigured', () => {
    it('returns true when API key is provided', () => {
      const provider = new GoogleStreetViewProvider('test-api-key');
      expect(provider.isConfigured()).toBe(true);
    });

    it('returns false when API key is empty', () => {
      const provider = new GoogleStreetViewProvider('');
      expect(provider.isConfigured()).toBe(false);
    });
  });

  describe('generateEmbedUrl', () => {
    it('generates correct embed URL', () => {
      const provider = new GoogleStreetViewProvider('test-api-key');
      const url = provider.generateEmbedUrl({ lng: -122.4194, lat: 37.7749 }, 90, 10);

      expect(url).toContain('key=test-api-key');
      expect(url).toContain('location=37.7749%2C-122.4194');
      expect(url).toContain('heading=90');
      expect(url).toContain('pitch=10');
    });

    it('omits zero heading and pitch', () => {
      const provider = new GoogleStreetViewProvider('test-api-key');
      const url = provider.generateEmbedUrl({ lng: 0, lat: 0 });

      expect(url).not.toContain('heading');
      expect(url).not.toContain('pitch');
    });
  });

  describe('name and displayName', () => {
    it('has correct name', () => {
      const provider = new GoogleStreetViewProvider('key');
      expect(provider.name).toBe('google');
      expect(provider.displayName).toBe('Google');
    });
  });

  describe('getViewState', () => {
    it('returns view state', () => {
      const provider = new GoogleStreetViewProvider('key');
      const state = provider.getViewState();

      expect(state).toHaveProperty('heading');
      expect(state).toHaveProperty('pitch');
    });
  });

  describe('destroy', () => {
    it('cleans up without error', () => {
      const provider = new GoogleStreetViewProvider('key');
      expect(() => provider.destroy()).not.toThrow();
    });
  });

  describe('render with view', () => {
    it('applies heading and pitch to the embed URL', () => {
      const provider = new GoogleStreetViewProvider('test-api-key');
      const container = document.createElement('div');

      provider.render(container, createGoogleImagery(), { heading: 90, pitch: 15 });

      const iframe = container.querySelector('iframe');
      expect(iframe?.src).toContain('heading=90');
      expect(iframe?.src).toContain('pitch=15');
    });

    it('resets to the default view when no view is given', () => {
      const provider = new GoogleStreetViewProvider('test-api-key');
      const container = document.createElement('div');

      provider.render(container, createGoogleImagery(), { heading: 90, pitch: 15 });
      provider.render(container, createGoogleImagery());

      const iframe = container.querySelector('iframe');
      expect(iframe?.src).not.toContain('heading');
      expect(iframe?.src).not.toContain('pitch');
    });
  });
});

describe('MapillaryProvider', () => {
  describe('isConfigured', () => {
    it('returns true when access token is provided', () => {
      const provider = new MapillaryProvider('test-token');
      expect(provider.isConfigured()).toBe(true);
    });

    it('returns false when access token is empty', () => {
      const provider = new MapillaryProvider('');
      expect(provider.isConfigured()).toBe(false);
    });
  });

  describe('name and displayName', () => {
    it('has correct name', () => {
      const provider = new MapillaryProvider('token');
      expect(provider.name).toBe('mapillary');
      expect(provider.displayName).toBe('Mapillary');
    });
  });

  describe('destroy', () => {
    it('cleans up without error', () => {
      const provider = new MapillaryProvider('token');
      expect(() => provider.destroy()).not.toThrow();
    });
  });

  describe('heading change callbacks', () => {
    it('registers and calls heading change callback', () => {
      const provider = new MapillaryProvider('token');
      const callback = vi.fn();

      provider.onHeadingChange(callback);

      // Simulate heading change by calling protected method
      // @ts-expect-error - accessing protected method for testing
      provider.emitHeadingChange(90);

      expect(callback).toHaveBeenCalledWith(90);
    });

    it('unregisters heading change callback', () => {
      const provider = new MapillaryProvider('token');
      const callback = vi.fn();

      provider.onHeadingChange(callback);
      provider.offHeadingChange(callback);

      // @ts-expect-error - accessing protected method for testing
      provider.emitHeadingChange(90);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('setHeading', () => {
    it('converts heading to basic coordinates for panoramas', async () => {
      const provider = new MapillaryProvider('token');
      provider.render(document.createElement('div'), createMapillaryImagery());

      const viewer = provider.getViewer() as unknown as MockedMapillaryViewer;
      await provider.setHeading(90);

      expect(viewer.setCenter).toHaveBeenCalledTimes(1);
      const [point] = viewer.setCenter.mock.calls[0];
      expect(point[0]).toBeCloseTo(0.75);
      expect(point[1]).toBe(0.5);
    });

    it('ignores non-panorama images', async () => {
      const provider = new MapillaryProvider('token');
      provider.render(document.createElement('div'), createMapillaryImagery());

      const viewer = provider.getViewer() as unknown as MockedMapillaryViewer;
      viewer.getImage.mockResolvedValue({ compassAngle: 0, cameraType: 'perspective' });

      await provider.setHeading(90);

      expect(viewer.setCenter).not.toHaveBeenCalled();
    });
  });

  describe('render', () => {
    it('keeps heading subscriptions made before render', () => {
      const provider = new MapillaryProvider('token');
      const callback = vi.fn();

      provider.onHeadingChange(callback);
      provider.render(document.createElement('div'), createMapillaryImagery());

      // render emits the initial imagery heading
      expect(callback).toHaveBeenCalledWith(45);
    });

    it('applies the requested initial heading once, when the image loads', () => {
      const provider = new MapillaryProvider('token');
      const onHeading = vi.fn();
      provider.onHeadingChange(onHeading);
      provider.render(document.createElement('div'), createMapillaryImagery(), { heading: 90 });

      const viewer = provider.getViewer() as unknown as MockedMapillaryViewer;
      const imageHandler = viewer.on.mock.calls.find(([name]: [string]) => name === 'image')?.[1];
      expect(imageHandler).toBeDefined();

      imageHandler({
        image: { lngLat: { lng: -122.4, lat: 37.7 }, compassAngle: 0, cameraType: 'spherical' },
      });
      expect(viewer.setCenter).toHaveBeenCalledWith([0.75, 0.5]);
      expect(onHeading).toHaveBeenLastCalledWith(90);

      viewer.setCenter.mockClear();
      imageHandler({
        image: { lngLat: { lng: -122.4, lat: 37.7 }, compassAngle: 0, cameraType: 'spherical' },
      });
      expect(viewer.setCenter).not.toHaveBeenCalled();
    });
  });
});

describe('headingToBasicPoint', () => {
  it('centers on the image compass angle when heading matches', () => {
    expect(headingToBasicPoint(0, 0)).toEqual([0.5, 0.5]);
    expect(headingToBasicPoint(123, 123)[0]).toBeCloseTo(0.5);
  });

  it('converts headings relative to the compass angle', () => {
    expect(headingToBasicPoint(90, 0)[0]).toBeCloseTo(0.75);
    expect(headingToBasicPoint(270, 0)[0]).toBeCloseTo(0.25);
    expect(headingToBasicPoint(0, 90)[0]).toBeCloseTo(0.25);
  });

  it('wraps coordinates into the [0, 1) interval', () => {
    expect(headingToBasicPoint(350, 0)[0]).toBeCloseTo(0.4722, 3);
    expect(headingToBasicPoint(0, 350)[0]).toBeCloseTo(0.5278, 3);
  });

  it('always centers vertically', () => {
    expect(headingToBasicPoint(42, 7)[1]).toBe(0.5);
  });
});
