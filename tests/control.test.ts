import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StreetViewControl } from '../src/lib/core/StreetViewControl';

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

describe('StreetViewControl API key inputs', () => {
  it('renders API key inputs and enables providers after submit', () => {
    const { container, map } = createMockMap();
    const control = new StreetViewControl({
      clickToView: false,
      showMarker: false,
    });

    control.onAdd(map as never);

    const form = container.querySelector<HTMLFormElement>('.streetview-api-keys');
    const inputs = container.querySelectorAll<HTMLInputElement>('.streetview-api-key-input');
    const googleTab = container.querySelector<HTMLButtonElement>('[data-provider="google"]');
    const mapillaryTab = container.querySelector<HTMLButtonElement>('[data-provider="mapillary"]');
    const keysTab = container.querySelector<HTMLButtonElement>('[data-provider="api-keys"]');
    const viewer = container.querySelector<HTMLElement>('.streetview-viewer');

    expect(form).not.toBeNull();
    expect(inputs).toHaveLength(2);
    expect(form?.hidden).toBe(true);
    expect(viewer?.hidden).toBe(false);
    expect(googleTab?.disabled).toBe(true);
    expect(mapillaryTab?.disabled).toBe(true);

    keysTab?.click();
    expect(form?.hidden).toBe(false);
    expect(viewer?.hidden).toBe(true);

    inputs[0].value = 'google-key';
    inputs[1].value = 'mapillary-token';
    form?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));

    expect(googleTab?.disabled).toBe(false);
    expect(mapillaryTab?.disabled).toBe(false);
    expect(form?.hidden).toBe(true);
    expect(viewer?.hidden).toBe(false);

    control.onRemove();
    container.remove();
  });

  it('can hide API key inputs with showApiKeyInputs=false', () => {
    const { container, map } = createMockMap();
    const control = new StreetViewControl({
      clickToView: false,
      showApiKeyInputs: false,
      showMarker: false,
    });

    control.onAdd(map as never);

    expect(container.querySelector('.streetview-api-keys')).toBeNull();

    control.onRemove();
    container.remove();
  });
});

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

    // A previous call with view options must not leak into later calls
    await control.showStreetView([-122.4194, 37.7749], { heading: 90, pitch: 15 });

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
});
