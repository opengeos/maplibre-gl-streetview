import maplibregl from 'maplibre-gl';
import { StreetViewControl } from '../../src/index';
import '../../src/index.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'mapillary-js/dist/mapillary.css';

// Get API keys from environment variables (Vite exposes them via import.meta.env)
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const MAPILLARY_TOKEN = import.meta.env.VITE_MAPILLARY_ACCESS_TOKEN || '';

// Log configuration status
console.log('Google Street View:', GOOGLE_API_KEY ? 'Configured' : 'Not configured');
console.log('Mapillary:', MAPILLARY_TOKEN ? 'Configured' : 'Not configured');

// Create the map
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  center: [-122.4194, 37.7749], // San Francisco
  zoom: 14,
});

// Add navigation controls
map.addControl(new maplibregl.NavigationControl(), 'top-right');

// Add fullscreen control
map.addControl(new maplibregl.FullscreenControl(), 'top-right');

// Wait for map to load
map.on('load', () => {
  // Determine default provider based on available keys
  let defaultProvider: 'google' | 'mapillary' = 'google';
  if (!GOOGLE_API_KEY && MAPILLARY_TOKEN) {
    defaultProvider = 'mapillary';
  }

  // Create the street view control
  const streetViewControl = new StreetViewControl({
    title: 'Street View',
    collapsed: false, // Start expanded for demo
    panelWidth: 450,
    panelHeight: 350,
    defaultProvider: defaultProvider,
    googleApiKey: GOOGLE_API_KEY,
    mapillaryAccessToken: MAPILLARY_TOKEN,
    showMarker: true,
    clickToView: true,
    maxSearchRadius: 200,
    markerOptions: {
      color: '#ff5722',
      showDirection: true,
      directionColor: '#1976d2',
    },
  });

  // Add the control to the map
  map.addControl(streetViewControl, 'top-right');

  // Add Globe control to the map
  map.addControl(new maplibregl.GlobeControl(), 'top-right');

  // Listen for events
  streetViewControl.on('statechange', (event) => {
    console.log('State changed:', event.state);
  });

  streetViewControl.on('locationchange', (event) => {
    console.log('Location changed:', event.state.location);
  });

  streetViewControl.on('providerchange', (event) => {
    console.log('Provider changed to:', event.state.activeProvider);
  });

  streetViewControl.on('headingchange', (event) => {
    console.log('Heading changed to:', event.state.heading);
  });

  streetViewControl.on('load', (event) => {
    console.log('Imagery loaded:', event.state.imagery);
  });

  streetViewControl.on('error', (event) => {
    console.error('Street view error:', event.error);
  });

  streetViewControl.on('expand', () => {
    console.log('Panel expanded');
  });

  streetViewControl.on('collapse', () => {
    console.log('Panel collapsed');
  });

  console.log('Street view control added to map');

  // Example: Show street view at a specific location programmatically
  // Uncomment to test:
  // setTimeout(() => {
  //   streetViewControl.showStreetView([-122.4194, 37.7749]);
  // }, 2000);
});
