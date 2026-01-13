import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import maplibregl, { Map, LngLat } from 'maplibre-gl';
import { StreetViewControlReact, useStreetViewState, useStreetViewProvider } from '../../src/react';
import type { ProviderType, StreetViewState } from '../../src/react';
import '../../src/index.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'mapillary-js/dist/mapillary.css';

// Get API keys from environment variables
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const MAPILLARY_TOKEN = import.meta.env.VITE_MAPILLARY_ACCESS_TOKEN || '';

/**
 * Main App component demonstrating the React integration.
 */
function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);

  // Use the street view state hook
  const {
    state,
    toggle,
    expand,
    collapse,
    setProvider,
    setCollapsed,
  } = useStreetViewState({
    collapsed: false,
    activeProvider: GOOGLE_API_KEY ? 'google' : 'mapillary',
  });

  // Use the provider hook for availability checks
  const { availableProviders, getProviderDisplayName } = useStreetViewProvider({
    google: {
      enabled: true,
      apiKey: GOOGLE_API_KEY || null,
    },
    mapillary: {
      enabled: true,
      accessToken: MAPILLARY_TOKEN || null,
    },
  });

  // Initialize the map
  useEffect(() => {
    if (!mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-122.4194, 37.7749], // San Francisco
      zoom: 14,
    });

    // Add navigation controls
    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapInstance.addControl(new maplibregl.FullscreenControl(), 'top-right');

    mapInstance.on('load', () => {
      setMap(mapInstance);
    });

    return () => {
      mapInstance.remove();
    };
  }, []);

  // Handle state changes from the control
  const handleStateChange = (newState: StreetViewState) => {
    console.log('State changed:', newState);
    // Sync local state with control state
    setCollapsed(newState.collapsed);
  };

  // Handle provider changes
  const handleProviderChange = (provider: ProviderType) => {
    console.log('Provider changed to:', provider);
    setProvider(provider);
  };

  // Handle location changes
  const handleLocationChange = (location: LngLat | null) => {
    console.log('Location changed:', location);
  };

  // Handle errors
  const handleError = (error: Error) => {
    console.error('Street view error:', error);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Map container */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Control panel */}
      <div style={controlPanelStyle}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 14 }}>Street View Controls</h3>

        {/* Toggle button */}
        <button onClick={toggle} style={buttonStyle}>
          {state.collapsed ? 'Show' : 'Hide'} Panel
        </button>

        {/* Provider buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {(['google', 'mapillary'] as ProviderType[]).map((provider) => (
            <button
              key={provider}
              onClick={() => setProvider(provider)}
              disabled={!availableProviders.includes(provider)}
              style={{
                ...providerButtonStyle,
                backgroundColor: state.activeProvider === provider ? '#1976d2' : '#e0e0e0',
                color: state.activeProvider === provider ? 'white' : '#666',
                opacity: availableProviders.includes(provider) ? 1 : 0.5,
              }}
            >
              {getProviderDisplayName(provider).split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Status display */}
        <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
          <div>Provider: {getProviderDisplayName(state.activeProvider)}</div>
          <div>Panel: {state.collapsed ? 'Collapsed' : 'Expanded'}</div>
          {state.location && (
            <div>
              Location: {state.location.lng.toFixed(4)}, {state.location.lat.toFixed(4)}
            </div>
          )}
          {state.loading && <div>Loading...</div>}
          {state.error && <div style={{ color: '#d32f2f' }}>Error: {state.error}</div>}
        </div>
      </div>

      {/* Street View Control (headless component) */}
      {map && (
        <StreetViewControlReact
          map={map}
          title="Street View"
          collapsed={state.collapsed}
          defaultProvider={state.activeProvider}
          googleApiKey={GOOGLE_API_KEY}
          mapillaryAccessToken={MAPILLARY_TOKEN}
          panelWidth={450}
          panelHeight={350}
          showMarker={true}
          clickToView={true}
          maxSearchRadius={200}
          onStateChange={handleStateChange}
          onProviderChange={handleProviderChange}
          onLocationChange={handleLocationChange}
          onError={handleError}
        />
      )}
    </div>
  );
}

// Styles
const controlPanelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 10,
  left: 10,
  zIndex: 1,
  background: 'white',
  padding: 16,
  borderRadius: 8,
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
  minWidth: 200,
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  background: '#4a90d9',
  color: 'white',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: 13,
};

const providerButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: 12,
  transition: 'all 0.2s',
};

// Mount the app
const root = createRoot(document.getElementById('root')!);
root.render(<App />);
