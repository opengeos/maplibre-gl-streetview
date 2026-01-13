import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleStreetViewProvider } from '../src/lib/providers/GoogleStreetViewProvider';
import { MapillaryProvider } from '../src/lib/providers/MapillaryProvider';

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
});
