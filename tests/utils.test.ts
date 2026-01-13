import { describe, it, expect } from 'vitest';
import {
  clamp,
  generateId,
  normalizeHeading,
  classNames,
  debounce,
  throttle,
} from '../src/lib/utils/helpers';
import {
  createBbox,
  calculateDistance,
  calculateBearing,
  bboxToString,
} from '../src/lib/utils/geo';
import { buildUrl } from '../src/lib/utils/api';

describe('helpers', () => {
  describe('clamp', () => {
    it('clamps values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('handles edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('uses custom prefix', () => {
      const id = generateId('custom');
      expect(id.startsWith('custom-')).toBe(true);
    });

    it('uses default prefix', () => {
      const id = generateId();
      expect(id.startsWith('streetview-')).toBe(true);
    });
  });

  describe('normalizeHeading', () => {
    it('normalizes positive headings', () => {
      expect(normalizeHeading(0)).toBe(0);
      expect(normalizeHeading(180)).toBe(180);
      expect(normalizeHeading(360)).toBe(0);
      expect(normalizeHeading(450)).toBe(90);
    });

    it('normalizes negative headings', () => {
      expect(normalizeHeading(-90)).toBe(270);
      expect(normalizeHeading(-180)).toBe(180);
      expect(normalizeHeading(-360)).toBe(0);
    });
  });

  describe('classNames', () => {
    it('joins active class names', () => {
      const result = classNames({
        'class-a': true,
        'class-b': false,
        'class-c': true,
      });
      expect(result).toBe('class-a class-c');
    });

    it('returns empty string for no active classes', () => {
      const result = classNames({
        'class-a': false,
        'class-b': false,
      });
      expect(result).toBe('');
    });
  });

  describe('debounce', () => {
    it('debounces function calls', async () => {
      let callCount = 0;
      const fn = debounce(() => {
        callCount++;
      }, 100);

      fn();
      fn();
      fn();

      expect(callCount).toBe(0);

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(callCount).toBe(1);
    });
  });

  describe('throttle', () => {
    it('throttles function calls', async () => {
      let callCount = 0;
      const fn = throttle(() => {
        callCount++;
      }, 100);

      fn();
      fn();
      fn();

      expect(callCount).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 150));
      fn();
      expect(callCount).toBe(2);
    });
  });
});

describe('geo utilities', () => {
  describe('createBbox', () => {
    it('creates bounding box around a point', () => {
      const bbox = createBbox({ lng: 0, lat: 0 }, 100);

      expect(bbox.minLng).toBeLessThan(0);
      expect(bbox.maxLng).toBeGreaterThan(0);
      expect(bbox.minLat).toBeLessThan(0);
      expect(bbox.maxLat).toBeGreaterThan(0);
    });

    it('creates symmetric bbox at equator', () => {
      const bbox = createBbox({ lng: 0, lat: 0 }, 1000);

      const lngRange = bbox.maxLng - bbox.minLng;
      const latRange = bbox.maxLat - bbox.minLat;

      // At equator, lat and lng degrees are approximately equal
      expect(Math.abs(lngRange - latRange)).toBeLessThan(0.001);
    });
  });

  describe('bboxToString', () => {
    it('formats bbox as string', () => {
      const bbox = { minLng: -1, minLat: -2, maxLng: 1, maxLat: 2 };
      expect(bboxToString(bbox)).toBe('-1,-2,1,2');
    });
  });

  describe('calculateDistance', () => {
    it('calculates distance between two points', () => {
      // Approximately 111km for 1 degree at equator
      const distance = calculateDistance({ lng: 0, lat: 0 }, { lng: 1, lat: 0 });
      expect(distance).toBeGreaterThan(110000);
      expect(distance).toBeLessThan(112000);
    });

    it('returns 0 for same point', () => {
      const distance = calculateDistance({ lng: 0, lat: 0 }, { lng: 0, lat: 0 });
      expect(distance).toBe(0);
    });
  });

  describe('calculateBearing', () => {
    it('calculates bearing north', () => {
      const bearing = calculateBearing({ lng: 0, lat: 0 }, { lng: 0, lat: 1 });
      expect(bearing).toBeCloseTo(0, 0);
    });

    it('calculates bearing east', () => {
      const bearing = calculateBearing({ lng: 0, lat: 0 }, { lng: 1, lat: 0 });
      expect(bearing).toBeCloseTo(90, 0);
    });

    it('calculates bearing south', () => {
      const bearing = calculateBearing({ lng: 0, lat: 0 }, { lng: 0, lat: -1 });
      expect(bearing).toBeCloseTo(180, 0);
    });

    it('calculates bearing west', () => {
      const bearing = calculateBearing({ lng: 0, lat: 0 }, { lng: -1, lat: 0 });
      expect(bearing).toBeCloseTo(270, 0);
    });
  });
});

describe('api utilities', () => {
  describe('buildUrl', () => {
    it('builds URL with query parameters', () => {
      const url = buildUrl('https://example.com/api', {
        key: 'value',
        num: 123,
        bool: true,
      });

      expect(url).toContain('key=value');
      expect(url).toContain('num=123');
      expect(url).toContain('bool=true');
    });

    it('ignores empty values', () => {
      const url = buildUrl('https://example.com/api', {
        key: 'value',
        empty: '',
      });

      expect(url).toContain('key=value');
      expect(url).not.toContain('empty');
    });
  });
});
