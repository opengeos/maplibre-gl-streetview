# User-Controllable Heading & Pitch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users pass optional heading/pitch to `showStreetView()` and adjust the view afterwards via new `setHeading()`/`setPitch()` methods on `StreetViewControl` (Discussion #11).

**Architecture:** A sanitized `Partial<ViewState>` flows `showStreetView(lngLat, viewOptions)` → `Viewer.displayImagery(provider, imagery, view)` → `provider.render(container, imagery, view)`. Google applies heading/pitch to the Embed API URL; Mapillary applies heading best-effort to 360 panoramas by converting compass degrees to mapillary-js basic image coordinates. The control's setters delegate to optional provider setters and keep state/events in sync.

**Tech Stack:** TypeScript, MapLibre GL JS, mapillary-js 4.x, Vitest (jsdom, mocks in `tests/setup.ts`).

**Spec:** `docs/superpowers/specs/2026-06-06-user-controllable-heading-pitch-design.md`

**Branch:** `feat/user-controllable-heading-pitch` (already created)

## File Structure

| File | Change |
|---|---|
| `src/lib/utils/geo.ts` | Add pure `headingToBasicPoint()` conversion |
| `src/lib/utils/index.ts` | Export `headingToBasicPoint` |
| `src/lib/core/types.ts` | Add `ViewOptions`, `'pitchchange'` event, `view` param on `render()`, optional `setHeading?`/`setPitch?` on `IStreetViewProvider` |
| `src/lib/providers/BaseProvider.ts` | Update abstract `render()` signature |
| `src/lib/providers/GoogleStreetViewProvider.ts` | Seed `_heading`/`_pitch` from `view` in `render()` |
| `src/lib/providers/MapillaryProvider.ts` | Fix `setHeading()` (degrees → basic coords), apply initial heading on first image, fix render/destroy callback bug |
| `src/lib/components/Viewer.ts` | Pass `view` through `displayImagery()` |
| `src/lib/core/StreetViewControl.ts` | `viewOptions` param, sanitization, `setHeading()`/`setPitch()`, heading dedupe |
| `src/index.ts` | Export `ViewOptions` type |
| `tests/setup.ts` | Extend mapillary-js Viewer mock (`getImage`, `setCenter`, `getBearing`) |
| `tests/providers.test.ts` | Tests for conversion fn, Google render view, Mapillary heading |
| `tests/control.test.ts` | Tests for `showStreetView` viewOptions and the setters |
| `README.md`, `examples/basic/main.ts` | Docs |

---

### Task 1: `headingToBasicPoint()` conversion function

**Files:**
- Modify: `src/lib/utils/geo.ts` (append at end)
- Modify: `src/lib/utils/index.ts` (geo export block)
- Test: `tests/providers.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/providers.test.ts`:

```ts
import { headingToBasicPoint } from '../src/lib/utils/geo';

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
```

The `import` line goes with the other imports at the top of the file.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest --run tests/providers.test.ts`
Expected: FAIL — `headingToBasicPoint` is not exported.

- [ ] **Step 3: Implement the function**

Append to `src/lib/utils/geo.ts`:

```ts
/**
 * Converts a compass heading to mapillary-js basic image coordinates.
 *
 * Basic coordinates are 2D coordinates on the [0, 1] interval with the
 * origin at the top left corner of the original image. For a 360 panorama
 * the horizontal axis spans the full 360 degrees and the horizontal center
 * (x = 0.5) points at the image's compass angle.
 *
 * @param heading - The desired compass heading in degrees
 * @param compassAngle - The compass angle of the image in degrees
 * @returns Basic [x, y] coordinates centering the view on the heading
 */
export function headingToBasicPoint(heading: number, compassAngle: number): [number, number] {
  const x = 0.5 + (heading - compassAngle) / 360;
  return [((x % 1) + 1) % 1, 0.5];
}
```

In `src/lib/utils/index.ts`, add `headingToBasicPoint` to the geo export block:

```ts
// Geospatial utilities
export {
  toLngLat,
  createBbox,
  bboxToString,
  calculateDistance,
  calculateBearing,
  findClosestPoint,
  headingToBasicPoint,
} from './geo';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest --run tests/providers.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/geo.ts src/lib/utils/index.ts tests/providers.test.ts
git commit -m "feat: add headingToBasicPoint conversion for mapillary basic coordinates"
```

---

### Task 2: Type additions

**Files:**
- Modify: `src/lib/core/types.ts`
- Modify: `src/lib/providers/BaseProvider.ts`
- Modify: `src/index.ts`

No behavior change; verified by compiler + existing tests.

- [ ] **Step 1: Add `ViewOptions` to `src/lib/core/types.ts`**

Insert after the `MarkerOptions` interface:

```ts
/**
 * Optional view direction when showing street view imagery.
 */
export interface ViewOptions {
  /** Initial heading in degrees (0-360). Values outside the range are normalized. */
  heading?: number;

  /** Initial pitch in degrees (-90 to 90). Values outside the range are clamped. */
  pitch?: number;
}
```

- [ ] **Step 2: Add `'pitchchange'` to the `StreetViewEvent` union in `src/lib/core/types.ts`**

```ts
export type StreetViewEvent =
  | 'collapse'
  | 'expand'
  | 'statechange'
  | 'providerchange'
  | 'locationchange'
  | 'headingchange'
  | 'pitchchange'
  | 'error'
  | 'load';
```

- [ ] **Step 3: Extend `IStreetViewProvider` in `src/lib/core/types.ts`**

Replace the `render` member and add optional setters:

```ts
  /** Render the viewer into a container, optionally with an initial view */
  render(container: HTMLElement, imagery: ImageryResult, view?: Partial<ViewState>): void;

  /** Set the view heading, if supported by the provider */
  setHeading?(heading: number): void | Promise<void>;

  /** Set the view pitch, if supported by the provider */
  setPitch?(pitch: number): void | Promise<void>;
```

- [ ] **Step 4: Update the abstract `render` signature in `src/lib/providers/BaseProvider.ts`**

```ts
  /**
   * Render the street view imagery in a container.
   *
   * @param container - The DOM element to render into
   * @param imagery - The imagery to display
   * @param view - Optional initial view (heading/pitch)
   */
  abstract render(container: HTMLElement, imagery: ImageryResult, view?: Partial<ViewState>): void;
```

- [ ] **Step 5: Export `ViewOptions` from `src/index.ts`**

Add `ViewOptions,` to the type export block (after `ViewState,`).

- [ ] **Step 6: Verify compile and tests**

Run: `npx tsc -p tsconfig.json --noEmit && npm test`
Expected: no compile errors, all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/core/types.ts src/lib/providers/BaseProvider.ts src/index.ts
git commit -m "feat: add ViewOptions type, pitchchange event, and provider view hooks"
```

---

### Task 3: Google provider honors `view` in `render()`

**Files:**
- Modify: `src/lib/providers/GoogleStreetViewProvider.ts`
- Test: `tests/providers.test.ts`

- [ ] **Step 1: Write the failing tests**

In `tests/providers.test.ts`, add to the top imports:

```ts
import { LngLat } from 'maplibre-gl';
import type { ImageryResult } from '../src/lib/core/types';
```

Add a helper above the describes:

```ts
function createGoogleImagery(): ImageryResult {
  return {
    id: 'pano-1',
    location: new LngLat(-122.4194, 37.7749),
    provider: 'google',
    isPano: true,
  };
}
```

Add inside `describe('GoogleStreetViewProvider', ...)`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest --run tests/providers.test.ts`
Expected: FAIL — embed URL has no `heading`/`pitch` params.

- [ ] **Step 3: Implement**

In `src/lib/providers/GoogleStreetViewProvider.ts`, change `render` to:

```ts
  /**
   * Render Street View in an iframe.
   *
   * @param container - The container element
   * @param imagery - The imagery to display
   * @param view - Optional initial view (heading/pitch)
   */
  render(container: HTMLElement, imagery: ImageryResult, view?: Partial<ViewState>): void {
    this._container = container;
    this._currentImagery = imagery;
    this._heading = view?.heading ?? 0;
    this._pitch = view?.pitch ?? 0;
```

(The rest of the method body is unchanged.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest --run tests/providers.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/providers/GoogleStreetViewProvider.ts tests/providers.test.ts
git commit -m "feat: apply initial heading and pitch in Google Street View render"
```

---

### Task 4: Mapillary best-effort heading

**Files:**
- Modify: `src/lib/providers/MapillaryProvider.ts`
- Modify: `tests/setup.ts`
- Test: `tests/providers.test.ts`

Three changes: (a) fix `setHeading()` to convert degrees to basic coordinates via the current image's compass angle, panoramas only; (b) apply a pending initial heading on the first `image` event; (c) fix a pre-existing bug where `render()` calls `destroy()`, which clears `_headingCallbacks` that `Viewer.displayImagery()` subscribed just before calling `render()` — heading events from Mapillary never reach the control today.

- [ ] **Step 1: Extend the mapillary-js mock in `tests/setup.ts`**

Replace the mapillary-js mock with:

```ts
// Mock mapillary-js
vi.mock('mapillary-js', () => ({
  Viewer: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    off: vi.fn(),
    remove: vi.fn(),
    moveTo: vi.fn().mockResolvedValue(undefined),
    getBearing: vi.fn().mockResolvedValue(0),
    getImage: vi.fn().mockResolvedValue({ compassAngle: 0, cameraType: 'spherical' }),
    setCenter: vi.fn(),
    getPointOfView: vi.fn().mockReturnValue({ bearing: 0, tilt: 0, zoom: 1 }),
    setPointOfView: vi.fn().mockResolvedValue(undefined),
  })),
}));
```

- [ ] **Step 2: Write the failing tests**

Add a helper to `tests/providers.test.ts`:

```ts
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
```

Add inside `describe('MapillaryProvider', ...)`:

```ts
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
      provider.render(document.createElement('div'), createMapillaryImagery(), { heading: 90 });

      const viewer = provider.getViewer() as unknown as MockedMapillaryViewer;
      const imageHandler = viewer.on.mock.calls.find(([name]) => name === 'image')?.[1];
      expect(imageHandler).toBeDefined();

      imageHandler({
        image: { lngLat: { lng: -122.4, lat: 37.7 }, compassAngle: 0, cameraType: 'spherical' },
      });
      expect(viewer.setCenter).toHaveBeenCalledWith([0.75, 0.5]);

      viewer.setCenter.mockClear();
      imageHandler({
        image: { lngLat: { lng: -122.4, lat: 37.7 }, compassAngle: 0, cameraType: 'spherical' },
      });
      expect(viewer.setCenter).not.toHaveBeenCalled();
    });
  });
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest --run tests/providers.test.ts`
Expected: FAIL — `setCenter` called with `[90, 0]` (degrees bug), heading callback cleared by render, no pending-heading handling.

- [ ] **Step 4: Implement**

In `src/lib/providers/MapillaryProvider.ts`:

Add to imports: `headingToBasicPoint` from `'../utils/geo'` (extend the existing geo import).

Add a private field next to `_viewerContainer`:

```ts
  private _pendingHeading: number | undefined;
```

Replace `render` with:

```ts
  /**
   * Render Mapillary viewer in a container.
   *
   * @param container - The container element
   * @param imagery - The imagery to display
   * @param view - Optional initial view (heading is best-effort, panoramas only)
   */
  render(container: HTMLElement, imagery: ImageryResult, view?: Partial<ViewState>): void {
    // Clean up existing viewer (keep heading/location subscriptions)
    this.cleanupViewer();

    this._container = container;
    this._pendingHeading = view?.heading;

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
        // Apply the requested initial heading once (panoramas only)
        if (this._pendingHeading !== undefined) {
          const heading = this._pendingHeading;
          this._pendingHeading = undefined;
          if (image.cameraType === 'spherical') {
            try {
              this._viewer?.setCenter(headingToBasicPoint(heading, image.compassAngle));
            } catch (error) {
              console.error('Failed to set initial heading:', error);
            }
          }
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
```

Replace `destroy` with a `cleanupViewer`/`destroy` pair:

```ts
  /**
   * Remove the MapillaryJS viewer and its container, keeping subscriptions.
   */
  private cleanupViewer(): void {
    if (this._viewer) {
      this._viewer.remove();
      this._viewer = null;
    }
    if (this._viewerContainer) {
      this._viewerContainer.remove();
      this._viewerContainer = null;
    }
    this._container = null;
    this._pendingHeading = undefined;
  }

  /**
   * Clean up the MapillaryJS viewer.
   */
  destroy(): void {
    this.cleanupViewer();
    this._headingCallbacks.clear();
  }
```

Replace `setHeading` with:

```ts
  /**
   * Set the view bearing/heading. Best-effort: applies to 360 panoramas only.
   *
   * @param heading - The heading (0-360)
   */
  async setHeading(heading: number): Promise<void> {
    if (!this._viewer) return;

    try {
      const image = await this._viewer.getImage();
      if (image.cameraType !== 'spherical') return;
      this._viewer.setCenter(headingToBasicPoint(heading, image.compassAngle));
    } catch (error) {
      console.error('Failed to set heading:', error);
    }
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest --run tests/providers.test.ts`
Expected: PASS (all new and existing tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/providers/MapillaryProvider.ts tests/setup.ts tests/providers.test.ts
git commit -m "feat: best-effort Mapillary heading; fix setHeading coordinates and render callback bug"
```

---

### Task 5: `showStreetView` view options end-to-end

**Files:**
- Modify: `src/lib/components/Viewer.ts`
- Modify: `src/lib/core/StreetViewControl.ts`
- Test: `tests/control.test.ts`

- [ ] **Step 1: Write the failing tests**

In `tests/control.test.ts`, update the vitest import to include `beforeEach`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
```

Add helpers below `createMockMap()`:

```ts
function mockGoogleMetadata() {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    json: async () => ({
      status: 'OK',
      pano_id: 'pano-1',
      location: { lat: 37.7749, lng: -122.4194 },
    }),
  });
}

function createGoogleControl() {
  const { container, map } = createMockMap();
  const control = new StreetViewControl({
    clickToView: false,
    showMarker: false,
    googleApiKey: 'test-api-key',
  });
  control.onAdd(map as never);
  return { container, control };
}
```

Add a new describe block:

```ts
describe('StreetViewControl view options', () => {
  beforeEach(() => {
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('applies heading and pitch from showStreetView view options', async () => {
    mockGoogleMetadata();
    const { container, control } = createGoogleControl();

    await control.showStreetView([-122.4194, 37.7749], { heading: 90, pitch: 15 });

    const iframe = container.querySelector('iframe');
    expect(iframe?.src).toContain('heading=90');
    expect(iframe?.src).toContain('pitch=15');
    expect(control.getState().heading).toBe(90);
    expect(control.getState().pitch).toBe(15);

    control.onRemove();
    container.remove();
  });

  it('falls back to the default view when view options are omitted', async () => {
    mockGoogleMetadata();
    const { container, control } = createGoogleControl();

    await control.showStreetView([-122.4194, 37.7749]);

    const iframe = container.querySelector('iframe');
    expect(iframe?.src).not.toContain('heading');
    expect(iframe?.src).not.toContain('pitch');
    expect(control.getState().heading).toBe(0);
    expect(control.getState().pitch).toBe(0);

    control.onRemove();
    container.remove();
  });

  it('normalizes and clamps out-of-range view options', async () => {
    mockGoogleMetadata();
    const { container, control } = createGoogleControl();

    await control.showStreetView([-122.4194, 37.7749], { heading: 450, pitch: 120 });

    const iframe = container.querySelector('iframe');
    expect(iframe?.src).toContain('heading=90');
    expect(iframe?.src).toContain('pitch=90');
    expect(control.getState().heading).toBe(90);
    expect(control.getState().pitch).toBe(90);

    control.onRemove();
    container.remove();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest --run tests/control.test.ts`
Expected: FAIL — `showStreetView` does not accept a second argument (TS error) / URL lacks heading.

- [ ] **Step 3: Implement `Viewer.displayImagery` pass-through**

In `src/lib/components/Viewer.ts`, add `ViewState` to the type import:

```ts
import type { ImageryResult, IStreetViewProvider, ViewState } from '../core/types';
```

Change `displayImagery` to:

```ts
  /**
   * Displays imagery using a provider.
   *
   * @param provider - The street view provider
   * @param imagery - The imagery to display
   * @param view - Optional initial view (heading/pitch)
   */
  displayImagery(provider: IStreetViewProvider, imagery: ImageryResult, view?: Partial<ViewState>): void {
    this.clearContent();

    this._currentProvider = provider;
    provider.onHeadingChange(this._headingCallback);
    provider.onLocationChange(this._locationCallback);
    provider.render(this._element, imagery, view);
  }
```

- [ ] **Step 4: Implement control changes**

In `src/lib/core/StreetViewControl.ts`:

Add `ViewOptions` and `ViewState` to the type import from `'./types'`. Extend the helpers import:

```ts
import { createElement, generateId, normalizeHeading, clamp } from '../utils/helpers';
```

Add a private method (e.g. after `updatePanelPosition`):

```ts
  /**
   * Normalizes and clamps user-supplied view options.
   * Non-finite values are dropped.
   */
  private sanitizeViewOptions(viewOptions?: ViewOptions): Partial<ViewState> | undefined {
    if (!viewOptions) return undefined;

    const view: Partial<ViewState> = {};
    if (viewOptions.heading !== undefined && Number.isFinite(viewOptions.heading)) {
      view.heading = normalizeHeading(viewOptions.heading);
    }
    if (viewOptions.pitch !== undefined && Number.isFinite(viewOptions.pitch)) {
      view.pitch = clamp(viewOptions.pitch, -90, 90);
    }

    return view.heading === undefined && view.pitch === undefined ? undefined : view;
  }
```

Update `showStreetView`. The signature and doc become:

```ts
  /**
   * Shows street view imagery at a location.
   *
   * @param lngLat - The location to show
   * @param viewOptions - Optional initial heading/pitch (falls back to the
   *   provider's default view when omitted; best-effort for Mapillary)
   */
  async showStreetView(lngLat: LngLat | [number, number], viewOptions?: ViewOptions): Promise<void> {
    const view = this.sanitizeViewOptions(viewOptions);
    const location = toLngLat(lngLat);
```

In the `if (imagery)` branch, replace the body up to `this.emit('load');` with:

```ts
      if (imagery) {
        this._state.imagery = imagery;
        this._state.loading = false;

        // Seed state with the requested view
        if (view?.heading !== undefined) {
          this._state.heading = view.heading;
        }
        if (view?.pitch !== undefined) {
          this._state.pitch = view.pitch;
        }

        // Update marker to actual imagery location; requested heading wins
        // over the image's own compass heading
        if (this._marker && this._map) {
          this._marker.setLngLat(imagery.location);
          const markerHeading = view?.heading ?? imagery.heading;
          if (markerHeading !== undefined) {
            this._marker.setHeading(markerHeading);
          }
        }

        // Display imagery
        this._viewer?.displayImagery(provider, imagery, view);
        this.emit('load');
      } else {
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest --run tests/control.test.ts && npm test`
Expected: PASS (all files)

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/Viewer.ts src/lib/core/StreetViewControl.ts tests/control.test.ts
git commit -m "feat: accept optional heading and pitch in showStreetView (#11)"
```

---

### Task 6: `setHeading()` / `setPitch()` on the control

**Files:**
- Modify: `src/lib/core/StreetViewControl.ts`
- Test: `tests/control.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to the `'StreetViewControl view options'` describe block in `tests/control.test.ts`:

```ts
  it('updates the view with setHeading and setPitch', async () => {
    mockGoogleMetadata();
    const { container, control } = createGoogleControl();
    await control.showStreetView([-122.4194, 37.7749]);

    const onHeadingChange = vi.fn();
    const onPitchChange = vi.fn();
    control.on('headingchange', onHeadingChange);
    control.on('pitchchange', onPitchChange);

    control.setHeading(45);
    control.setPitch(-10);

    const iframe = container.querySelector('iframe');
    expect(iframe?.src).toContain('heading=45');
    expect(iframe?.src).toContain('pitch=-10');
    expect(control.getState().heading).toBe(45);
    expect(control.getState().pitch).toBe(-10);
    expect(onHeadingChange).toHaveBeenCalledTimes(1);
    expect(onPitchChange).toHaveBeenCalledTimes(1);

    control.onRemove();
    container.remove();
  });

  it('ignores setHeading and setPitch when no imagery is displayed', () => {
    const { container, control } = createGoogleControl();

    control.setHeading(45);
    control.setPitch(-10);

    expect(control.getState().heading).toBe(0);
    expect(control.getState().pitch).toBe(0);

    control.onRemove();
    container.remove();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest --run tests/control.test.ts`
Expected: FAIL — `setHeading`/`setPitch` do not exist on the control.

- [ ] **Step 3: Implement**

In `src/lib/core/StreetViewControl.ts`, make `handleHeadingChange` idempotent (avoids a duplicate `headingchange` when a provider echoes the value back synchronously):

```ts
  /**
   * Handles heading changes from the viewer.
   */
  private handleHeadingChange(heading: number): void {
    if (this._state.heading === heading) return;
    this._state.heading = heading;
    this._marker?.setHeading(heading);
    this.emit('headingchange');
  }
```

Add the public setters after `clearStreetView()`:

```ts
  /**
   * Sets the heading of the currently displayed street view.
   * Best-effort: no-op when no imagery is displayed or the active
   * provider does not support it.
   *
   * @param heading - The heading in degrees (0-360, normalized)
   */
  setHeading(heading: number): void {
    const provider = this._viewer?.getCurrentProvider();
    if (!provider?.setHeading || !Number.isFinite(heading)) return;

    const normalized = normalizeHeading(heading);
    void provider.setHeading(normalized);

    if (this._state.heading !== normalized) {
      this._state.heading = normalized;
      this._marker?.setHeading(normalized);
      this.emit('headingchange');
    }
    this.emit('statechange');
  }

  /**
   * Sets the pitch of the currently displayed street view.
   * Best-effort: no-op when no imagery is displayed or the active
   * provider does not support it.
   *
   * @param pitch - The pitch in degrees (-90 to 90, clamped)
   */
  setPitch(pitch: number): void {
    const provider = this._viewer?.getCurrentProvider();
    if (!provider?.setPitch || !Number.isFinite(pitch)) return;

    const clamped = clamp(pitch, -90, 90);
    void provider.setPitch(clamped);

    if (this._state.pitch !== clamped) {
      this._state.pitch = clamped;
      this.emit('pitchchange');
    }
    this.emit('statechange');
  }
```

- [ ] **Step 4: Run all tests and the compiler**

Run: `npm test && npx tsc -p tsconfig.json --noEmit`
Expected: PASS, no compile errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/core/StreetViewControl.ts tests/control.test.ts
git commit -m "feat: add setHeading and setPitch methods to StreetViewControl (#11)"
```

---

### Task 7: Documentation

**Files:**
- Modify: `README.md`
- Modify: `examples/basic/main.ts`

- [ ] **Step 1: Update the README Events table**

Add after the `headingchange` row:

```markdown
| `pitchchange` | View pitch changed |
```

- [ ] **Step 2: Update the README Methods table and add a usage snippet**

Replace the `showStreetView(lngLat)` row and add setter rows:

```markdown
| `showStreetView(lngLat, viewOptions?)` | Show street view at location, optionally with initial heading/pitch |
| `setHeading(heading)` | Set view heading in degrees (0-360) |
| `setPitch(pitch)` | Set view pitch in degrees (-90 to 90) |
```

Add directly below the Methods table:

```markdown
### Controlling Heading and Pitch

```typescript
// Show street view facing east, tilted slightly up
streetView.showStreetView([-122.4194, 37.7749], { heading: 90, pitch: 10 });

// Adjust the current view afterwards
streetView.setHeading(180);
streetView.setPitch(-15);
```

Heading and pitch are fully supported for Google Street View. For Mapillary,
heading is applied best-effort to 360 panoramas and pitch is ignored. When
`viewOptions` is omitted, the provider's default view is used.
```

(Use a fenced code block inside the section as shown.)

- [ ] **Step 3: Update the example snippet in `examples/basic/main.ts`**

Replace the commented programmatic example at the bottom with:

```ts
  // Example: Show street view at a specific location programmatically,
  // optionally with an initial heading (0-360) and pitch (-90 to 90).
  // Uncomment to test:
  // setTimeout(() => {
  //   streetViewControl.showStreetView([-122.4194, 37.7749], { heading: 90, pitch: 10 });
  // }, 2000);
```

- [ ] **Step 4: Commit**

```bash
git add README.md examples/basic/main.ts
git commit -m "docs: document heading and pitch view options"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run the full suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 2: Lint and build**

Run: `npm run lint && npm run build`
Expected: no lint errors, build succeeds.

- [ ] **Step 3: Pre-commit hooks**

Run: `pre-commit run --all-files`
Expected: all hooks pass (fix and re-run if formatters modify files; amend or commit fixes).

- [ ] **Step 4: Commit any remaining fixes**

```bash
git status --short   # commit any hook-modified files with: git commit -am "chore: apply pre-commit fixes"
```
