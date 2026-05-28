import { describe, expect, it, vi } from 'vitest';
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
