import { useEffect, useRef } from 'react';
import { StreetViewControl } from './StreetViewControl';
import type { StreetViewControlReactProps } from './types';

/**
 * React wrapper component for StreetViewControl.
 * Manages the control lifecycle within React's component lifecycle.
 *
 * This is a headless component that renders nothing but manages the
 * StreetViewControl instance on the map.
 *
 * @param props - Component props including map instance and callbacks
 * @returns null (renders nothing)
 */
export function StreetViewControlReact({
  map,
  onStateChange,
  onProviderChange,
  onLocationChange,
  onHeadingChange,
  onError,
  collapsed,
  defaultProvider,
  ...options
}: StreetViewControlReactProps): null {
  const controlRef = useRef<StreetViewControl | null>(null);
  const callbacksRef = useRef({
    onStateChange,
    onProviderChange,
    onLocationChange,
    onHeadingChange,
    onError,
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onStateChange,
      onProviderChange,
      onLocationChange,
      onHeadingChange,
      onError,
    };
  }, [onStateChange, onProviderChange, onLocationChange, onHeadingChange, onError]);

  // Initialize and cleanup control
  useEffect(() => {
    if (!map) return;

    const control = new StreetViewControl({
      ...options,
      collapsed: collapsed ?? true,
      defaultProvider: defaultProvider ?? 'google',
    });

    controlRef.current = control;

    // Register event handlers
    control.on('statechange', (event) => {
      callbacksRef.current.onStateChange?.(event.state);
    });

    control.on('providerchange', (event) => {
      callbacksRef.current.onProviderChange?.(event.state.activeProvider);
    });

    control.on('locationchange', (event) => {
      callbacksRef.current.onLocationChange?.(event.state.location);
    });

    control.on('headingchange', (event) => {
      callbacksRef.current.onHeadingChange?.(event.state.heading);
    });

    control.on('error', (event) => {
      if (event.error) {
        callbacksRef.current.onError?.(event.error);
      }
    });

    // Add control to map
    map.addControl(control, options.position ?? 'top-right');

    return () => {
      if (map.hasControl(control)) {
        map.removeControl(control);
      }
      controlRef.current = null;
    };
  }, [map]); // Only re-create when map changes

  // Sync collapsed state with control
  useEffect(() => {
    const control = controlRef.current;
    if (!control) return;

    const currentState = control.getState();
    if (collapsed !== undefined && collapsed !== currentState.collapsed) {
      if (collapsed) {
        control.collapse();
      } else {
        control.expand();
      }
    }
  }, [collapsed]);

  // Sync provider with control
  useEffect(() => {
    const control = controlRef.current;
    if (!control || !defaultProvider) return;

    const currentState = control.getState();
    if (defaultProvider !== currentState.activeProvider) {
      control.setProvider(defaultProvider);
    }
  }, [defaultProvider]);

  // This component renders nothing - it's a headless component
  return null;
}
