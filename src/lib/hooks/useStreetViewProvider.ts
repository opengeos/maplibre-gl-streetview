import { useMemo, useCallback } from 'react';
import type { ProviderType, ProviderConfig } from '../core/types';

/**
 * React hook for managing street view provider configuration.
 * Helps determine which providers are available and enabled.
 *
 * @param config - Provider configuration object
 * @returns Provider availability helpers
 */
export function useStreetViewProvider(config: ProviderConfig) {
  /**
   * List of available (configured) providers.
   */
  const availableProviders = useMemo(() => {
    const providers: ProviderType[] = [];
    if (config.google.enabled && config.google.apiKey) {
      providers.push('google');
    }
    if (config.mapillary.enabled && config.mapillary.accessToken) {
      providers.push('mapillary');
    }
    return providers;
  }, [config]);

  /**
   * Checks if a provider is available (configured).
   */
  const isProviderAvailable = useCallback(
    (provider: ProviderType) => {
      return availableProviders.includes(provider);
    },
    [availableProviders]
  );

  /**
   * Gets the default (first available) provider.
   */
  const getDefaultProvider = useCallback((): ProviderType | null => {
    return availableProviders[0] ?? null;
  }, [availableProviders]);

  /**
   * Checks if any provider is available.
   */
  const hasAnyProvider = useMemo(() => {
    return availableProviders.length > 0;
  }, [availableProviders]);

  /**
   * Gets the provider display name.
   */
  const getProviderDisplayName = useCallback((provider: ProviderType): string => {
    return provider === 'google' ? 'Google Street View' : 'Mapillary';
  }, []);

  return {
    availableProviders,
    isProviderAvailable,
    getDefaultProvider,
    hasAnyProvider,
    getProviderDisplayName,
  };
}
