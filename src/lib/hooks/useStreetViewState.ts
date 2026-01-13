import { useState, useCallback } from 'react';
import type { LngLat } from 'maplibre-gl';
import type { StreetViewState, ProviderType, ImageryResult } from '../core/types';

/**
 * Default initial state for the street view control.
 */
const DEFAULT_STATE: StreetViewState = {
  collapsed: true,
  activeProvider: 'google',
  location: null,
  imagery: null,
  heading: 0,
  pitch: 0,
  loading: false,
  error: null,
};

/**
 * React hook for managing street view control state.
 * Provides state and setter functions for controlling the street view panel.
 *
 * @param initialState - Optional initial state values
 * @returns State object and setter functions
 */
export function useStreetViewState(initialState?: Partial<StreetViewState>) {
  const [state, setState] = useState<StreetViewState>({
    ...DEFAULT_STATE,
    ...initialState,
  });

  /**
   * Sets the collapsed state.
   */
  const setCollapsed = useCallback((collapsed: boolean) => {
    setState((prev) => ({ ...prev, collapsed }));
  }, []);

  /**
   * Sets the active provider.
   */
  const setProvider = useCallback((provider: ProviderType) => {
    setState((prev) => ({ ...prev, activeProvider: provider }));
  }, []);

  /**
   * Sets the current location.
   */
  const setLocation = useCallback((location: LngLat | null) => {
    setState((prev) => ({ ...prev, location }));
  }, []);

  /**
   * Sets the current imagery.
   */
  const setImagery = useCallback((imagery: ImageryResult | null) => {
    setState((prev) => ({ ...prev, imagery }));
  }, []);

  /**
   * Sets the view heading.
   */
  const setHeading = useCallback((heading: number) => {
    setState((prev) => ({ ...prev, heading }));
  }, []);

  /**
   * Sets the loading state.
   */
  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  /**
   * Sets the error state.
   */
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  /**
   * Toggles the collapsed state.
   */
  const toggle = useCallback(() => {
    setState((prev) => ({ ...prev, collapsed: !prev.collapsed }));
  }, []);

  /**
   * Expands the panel.
   */
  const expand = useCallback(() => {
    setState((prev) => ({ ...prev, collapsed: false }));
  }, []);

  /**
   * Collapses the panel.
   */
  const collapse = useCallback(() => {
    setState((prev) => ({ ...prev, collapsed: true }));
  }, []);

  /**
   * Resets the state to initial values.
   */
  const reset = useCallback(() => {
    setState({ ...DEFAULT_STATE, ...initialState });
  }, [initialState]);

  return {
    state,
    setState,
    setCollapsed,
    setProvider,
    setLocation,
    setImagery,
    setHeading,
    setLoading,
    setError,
    toggle,
    expand,
    collapse,
    reset,
  };
}
