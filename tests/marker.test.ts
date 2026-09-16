import { describe, expect, it, vi } from 'vitest';
import { StreetViewControl } from '../src/lib/core/StreetViewControl';
import { StreetViewMarker } from '../src/lib/components/Marker';
import type { CreateStreetViewMarker } from '../src/lib/core/types';

function createMockMap() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return {
    container,
    map: {
      getContainer: () => container,
      on: vi.fn(),
      off: vi.fn(),
    },
  };
}

/**
 * A marker of some other engine: only the three members the control is
 * documented to call, so a factory that satisfies nothing more still works.
 */
function fakeEngineMarker() {
  const calls = { added: [] as unknown[], lngLats: [] as unknown[], removed: 0 };
  const marker = {
    calls,
    setLngLat(lngLat: unknown) {
      calls.lngLats.push(lngLat);
    },
    addTo(map: unknown) {
      calls.added.push(map);
    },
    remove() {
      calls.removed += 1;
    },
  };
  return marker;
}

describe('StreetViewMarker createMarker', () => {
  it('places the control element with maplibre-gl by default', () => {
    const marker = new StreetViewMarker();
    // maplibre-gl's Marker keeps the element it was handed, so a default-built
    // marker still owns the control's own DOM.
    expect(marker.getElement().classList.contains('streetview-marker')).toBe(true);
    expect(marker.getMarker()).not.toBe(marker.getElement());
  });

  it('hands the control element to a supplied factory, not a MapLibre marker', () => {
    const engineMarker = fakeEngineMarker();
    const create = vi.fn(() => engineMarker) as unknown as CreateStreetViewMarker;
    const marker = new StreetViewMarker({}, create);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({ element: marker.getElement(), anchor: 'center' });
    expect(marker.getMarker()).toBe(engineMarker);
  });

  it('drives the supplied marker through setLngLat / addTo / remove only', () => {
    const engineMarker = fakeEngineMarker();
    const marker = new StreetViewMarker({}, (() => engineMarker) as unknown as CreateStreetViewMarker);
    const map = { some: 'map' };

    marker.addTo(map, [-122.4194, 37.7749]);
    expect(engineMarker.calls.lngLats).toEqual([[-122.4194, 37.7749]]);
    expect(engineMarker.calls.added).toEqual([map]);

    marker.setLngLat([0, 0]);
    expect(engineMarker.calls.lngLats).toEqual([[-122.4194, 37.7749], [0, 0]]);

    marker.remove();
    expect(engineMarker.calls.removed).toBe(1);
  });

  it('keeps the direction arrow in the control element, whichever engine positions it', () => {
    const engineMarker = fakeEngineMarker();
    const marker = new StreetViewMarker(
      { showDirection: true },
      (() => engineMarker) as unknown as CreateStreetViewMarker,
    );

    marker.setHeading(90);
    const direction = marker.getElement().querySelector<HTMLElement>('.streetview-marker-direction');
    expect(direction?.style.transform).toContain('rotate(90deg)');
  });
});

describe('StreetViewControl createMarker option', () => {
  it('builds the location marker through the factory the host supplies', () => {
    const { map } = createMockMap();
    const engineMarker = fakeEngineMarker();
    const create = vi.fn(() => engineMarker) as unknown as CreateStreetViewMarker;

    const control = new StreetViewControl({
      clickToView: false,
      showMarker: true,
      googleApiKey: 'test-api-key',
      createMarker: create,
    });
    control.onAdd(map as never);

    expect(create).toHaveBeenCalledTimes(1);

    // onRemove takes the marker off the map through the same handle.
    control.onRemove();
    expect(engineMarker.calls.removed).toBeGreaterThan(0);
  });

  it('does not build a marker at all when showMarker is off', () => {
    const { map } = createMockMap();
    const create = vi.fn(() => fakeEngineMarker()) as unknown as CreateStreetViewMarker;

    const control = new StreetViewControl({
      clickToView: false,
      showMarker: false,
      googleApiKey: 'test-api-key',
      createMarker: create,
    });
    control.onAdd(map as never);

    expect(create).not.toHaveBeenCalled();
    control.onRemove();
  });
});
