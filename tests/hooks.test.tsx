import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreetViewState } from '../src/lib/hooks/useStreetViewState';
import { useStreetViewProvider } from '../src/lib/hooks/useStreetViewProvider';

describe('useStreetViewState', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useStreetViewState());

    expect(result.current.state.collapsed).toBe(true);
    expect(result.current.state.activeProvider).toBe('google');
    expect(result.current.state.location).toBe(null);
    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.error).toBe(null);
  });

  it('initializes with custom initial state', () => {
    const { result } = renderHook(() =>
      useStreetViewState({
        collapsed: false,
        activeProvider: 'mapillary',
      })
    );

    expect(result.current.state.collapsed).toBe(false);
    expect(result.current.state.activeProvider).toBe('mapillary');
  });

  it('toggles collapsed state', () => {
    const { result } = renderHook(() => useStreetViewState());

    expect(result.current.state.collapsed).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.state.collapsed).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.state.collapsed).toBe(true);
  });

  it('expands and collapses', () => {
    const { result } = renderHook(() => useStreetViewState());

    act(() => {
      result.current.expand();
    });
    expect(result.current.state.collapsed).toBe(false);

    act(() => {
      result.current.collapse();
    });
    expect(result.current.state.collapsed).toBe(true);
  });

  it('changes provider', () => {
    const { result } = renderHook(() => useStreetViewState());

    act(() => {
      result.current.setProvider('mapillary');
    });

    expect(result.current.state.activeProvider).toBe('mapillary');
  });

  it('sets loading state', () => {
    const { result } = renderHook(() => useStreetViewState());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.state.loading).toBe(true);
  });

  it('sets error state', () => {
    const { result } = renderHook(() => useStreetViewState());

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.state.error).toBe('Test error');
  });

  it('resets to initial state', () => {
    const { result } = renderHook(() =>
      useStreetViewState({ collapsed: false })
    );

    act(() => {
      result.current.setProvider('mapillary');
      result.current.setLoading(true);
      result.current.setError('Error');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.state.collapsed).toBe(false); // Custom initial
    expect(result.current.state.activeProvider).toBe('google'); // Default
    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.error).toBe(null);
  });
});

describe('useStreetViewProvider', () => {
  it('returns available providers', () => {
    const { result } = renderHook(() =>
      useStreetViewProvider({
        google: { enabled: true, apiKey: 'test-key' },
        mapillary: { enabled: true, accessToken: 'test-token' },
      })
    );

    expect(result.current.availableProviders).toContain('google');
    expect(result.current.availableProviders).toContain('mapillary');
    expect(result.current.hasAnyProvider).toBe(true);
  });

  it('excludes unconfigured providers', () => {
    const { result } = renderHook(() =>
      useStreetViewProvider({
        google: { enabled: true, apiKey: null },
        mapillary: { enabled: true, accessToken: 'test-token' },
      })
    );

    expect(result.current.availableProviders).not.toContain('google');
    expect(result.current.availableProviders).toContain('mapillary');
  });

  it('excludes disabled providers', () => {
    const { result } = renderHook(() =>
      useStreetViewProvider({
        google: { enabled: false, apiKey: 'test-key' },
        mapillary: { enabled: true, accessToken: 'test-token' },
      })
    );

    expect(result.current.availableProviders).not.toContain('google');
    expect(result.current.availableProviders).toContain('mapillary');
  });

  it('checks provider availability', () => {
    const { result } = renderHook(() =>
      useStreetViewProvider({
        google: { enabled: true, apiKey: 'test-key' },
        mapillary: { enabled: false, accessToken: null },
      })
    );

    expect(result.current.isProviderAvailable('google')).toBe(true);
    expect(result.current.isProviderAvailable('mapillary')).toBe(false);
  });

  it('gets default provider', () => {
    const { result } = renderHook(() =>
      useStreetViewProvider({
        google: { enabled: true, apiKey: 'test-key' },
        mapillary: { enabled: true, accessToken: 'test-token' },
      })
    );

    expect(result.current.getDefaultProvider()).toBe('google');
  });

  it('returns null when no providers available', () => {
    const { result } = renderHook(() =>
      useStreetViewProvider({
        google: { enabled: false, apiKey: null },
        mapillary: { enabled: false, accessToken: null },
      })
    );

    expect(result.current.getDefaultProvider()).toBe(null);
    expect(result.current.hasAnyProvider).toBe(false);
  });

  it('gets provider display name', () => {
    const { result } = renderHook(() =>
      useStreetViewProvider({
        google: { enabled: true, apiKey: 'key' },
        mapillary: { enabled: true, accessToken: 'token' },
      })
    );

    expect(result.current.getProviderDisplayName('google')).toBe('Google Street View');
    expect(result.current.getProviderDisplayName('mapillary')).toBe('Mapillary');
  });
});
