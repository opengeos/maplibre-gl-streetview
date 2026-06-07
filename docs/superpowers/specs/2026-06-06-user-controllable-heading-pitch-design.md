# User-Controllable Heading & Pitch

**Date:** 2026-06-06
**Source:** [Discussion #11](https://github.com/opengeos/maplibre-gl-streetview/discussions/11)

## Goal

Let library users control the initial view direction (heading and pitch) of street-level
imagery, and adjust it programmatically afterward. When not specified, behavior is
unchanged from today (provider default view).

## Scope

- Optional `viewOptions` parameter on `StreetViewControl.showStreetView()`.
- Public `setHeading()` and `setPitch()` methods on `StreetViewControl`.
- Full support for Google Street View (Embed API supports `heading` and `pitch` natively).
- Best-effort heading support for Mapillary 360 panoramas; pitch is ignored for Mapillary.
- Fix the existing broken `MapillaryProvider.setHeading()`, which passes compass degrees
  into `viewer.setCenter()` (which expects 0-1 basic image coordinates).

Out of scope: constructor-level default heading/pitch options, new React wrapper props.

## Public API

```ts
// core/types.ts (new exported type)
export interface ViewOptions {
  /** Initial heading in degrees (0-360). Normalized to [0, 360) via ((heading % 360) + 360) % 360. */
  heading?: number;
  /** Initial pitch in degrees (-90 to 90). Clamped via Math.max(-90, Math.min(90, pitch)). */
  pitch?: number;
}

// StreetViewControl
async showStreetView(lngLat: LngLat | [number, number], viewOptions?: ViewOptions): Promise<void>;
setHeading(heading: number): void; // adjust current view; updates state; emits 'headingchange'
setPitch(pitch: number): void;     // adjust current view; updates state; emits 'pitchchange'
```

- Omitting `viewOptions` preserves current behavior exactly.
- Heading is normalized to `[0, 360)`; pitch is clamped to `[-90, 90]`. Non-finite values
  are ignored (treated as absent). Sanitization never throws.
- `setHeading()`/`setPitch()` are no-ops when no imagery is currently displayed.
- `'headingchange'`/`'pitchchange'` are emitted only when the value actually changes;
  `'statechange'` is emitted on every setter call because the provider view is
  re-asserted even for equal values (the Google embed view can drift without the
  control knowing).
- A new `'pitchchange'` event type is added to `StreetViewEvent` for symmetry with the
  existing `'headingchange'` event.
- The React wrapper gains no new props; the setters are reachable via the control
  instance and `onStateChange` already surfaces `state.heading`/`state.pitch`.

## Data Flow

```text
showStreetView(lngLat, viewOptions)
  -> sanitize viewOptions; seed state.heading / state.pitch when provided
  -> Viewer.displayImagery(provider, imagery, view?)
  -> provider.render(container, imagery, view?: Partial<ViewState>)
```

`IStreetViewProvider.render()` gains an optional third parameter
`view?: Partial<ViewState>`. The parameter is optional, so existing implementations and
callers remain source-compatible. Each provider decides which parts of the requested view
it can honor.

## Provider Behavior

### Google (`GoogleStreetViewProvider`)

- `render()` seeds the internal `_heading`/`_pitch` fields from `view` before building the
  embed URL, so the iframe loads once with the correct `heading`/`pitch` query parameters.
- The existing behavior of omitting `heading`/`pitch` URL parameters when they are 0 is
  kept.
- Existing `setHeading()`/`setPitch()` (iframe reload) are reused by the control's new
  public setters.

### Mapillary (`MapillaryProvider`)

- Heading is best-effort and applies to 360 panoramas only. Conversion from compass
  degrees to mapillary-js basic image coordinates:
  `basicX = wrap01(0.5 + (heading - image.compassAngle) / 360)`, `basicY = 0.5`,
  then `viewer.setCenter([basicX, basicY])`.
- The conversion is implemented as a pure, unit-testable function.
- The initial heading from `viewOptions` is applied after the viewer's first `image`
  event, when `compassAngle` is available.
- Pitch and non-panorama images: silently ignored (documented as best-effort).
- The existing `setHeading()` bug (degrees passed to `setCenter`) is fixed by this
  conversion.

### Marker

The marker's direction indicator picks up the requested heading through the existing
heading-change path; no marker changes needed.

## Error Handling

- No imagery / no coverage: unchanged (existing nearest-search and no-data flow).
- Mapillary `setCenter()` failure: caught and logged; the view stays at the provider
  default, consistent with the best-effort contract.
- Out-of-range or non-finite `viewOptions` values never throw; they are normalized,
  clamped, or ignored.

## Testing

- `tests/control.test.ts`: `showStreetView` with and without `viewOptions` (state
  seeding, unchanged fallback); `setHeading`/`setPitch` (state update, event emission,
  no-op when no imagery is displayed).
- `tests/providers.test.ts`: Google embed URL contains `heading`/`pitch` when passed to
  `render()` and omits them when absent; Mapillary degrees-to-basic-coordinate conversion
  math (pure function).
- Documentation: README section describing `viewOptions` and the setters; note in
  `examples/basic`.
