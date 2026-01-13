# maplibre-gl-streetview

[![npm version](https://badge.fury.io/js/maplibre-gl-streetview.svg)](https://www.npmjs.com/package/maplibre-gl-streetview)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Street View control for [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) with support for both **Google Street View** and **Mapillary** imagery.

## Features

- **Dual Provider Support**: Switch between Google Street View and Mapillary imagery
- **Click-to-View**: Click anywhere on the map to view street-level imagery
- **Interactive Viewers**:
  - Google Street View: Interactive 360° panoramas via iframe embed
  - Mapillary: Full MapillaryJS viewer with navigation
- **Collapsible & Resizable Panel**: Adjustable panel that doesn't obstruct the map
- **Direction Marker**: Map marker showing current view location and heading direction
- **Nearest Coverage Search**: Automatically finds nearby imagery when none exists at clicked location
- **React Support**: Full React integration with hooks and wrapper component
- **TypeScript**: Written in TypeScript with complete type definitions

## Installation

```bash
npm install maplibre-gl-streetview
```

## Quick Start

### Vanilla JavaScript/TypeScript

```typescript
import maplibregl from 'maplibre-gl';
import { StreetViewControl } from 'maplibre-gl-streetview';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'maplibre-gl-streetview/style.css';
import 'mapillary-js/dist/mapillary.css'; // Required for Mapillary viewer

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-122.4194, 37.7749],
  zoom: 14,
});

map.on('load', () => {
  const streetView = new StreetViewControl({
    googleApiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
    mapillaryAccessToken: 'YOUR_MAPILLARY_ACCESS_TOKEN',
    defaultProvider: 'google',
    panelWidth: 400,
    panelHeight: 300,
  });

  map.addControl(streetView, 'top-right');

  // Listen for events
  streetView.on('locationchange', (event) => {
    console.log('Viewing:', event.state.location);
  });
});
```

### React

```tsx
import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import { StreetViewControlReact, useStreetViewState } from 'maplibre-gl-streetview/react';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'maplibre-gl-streetview/style.css';
import 'mapillary-js/dist/mapillary.css';

function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const { state, toggle, setProvider } = useStreetViewState();

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-122.4194, 37.7749],
      zoom: 14,
    });

    mapInstance.on('load', () => setMap(mapInstance));

    return () => mapInstance.remove();
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {map && (
        <StreetViewControlReact
          map={map}
          googleApiKey="YOUR_GOOGLE_MAPS_API_KEY"
          mapillaryAccessToken="YOUR_MAPILLARY_ACCESS_TOKEN"
          collapsed={state.collapsed}
          defaultProvider={state.activeProvider}
          onStateChange={(newState) => console.log(newState)}
        />
      )}
    </div>
  );
}
```

## API Keys

### Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Maps Embed API**
4. Create an API key in Credentials

### Mapillary Access Token

1. Sign up at [Mapillary](https://www.mapillary.com/)
2. Go to [Developer Dashboard](https://www.mapillary.com/dashboard/developers)
3. Create a new application
4. Copy your client access token

## Options

### StreetViewControlOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `collapsed` | `boolean` | `true` | Start with panel collapsed |
| `position` | `string` | `'top-right'` | Control position on map |
| `title` | `string` | `'Street View'` | Panel header title |
| `panelWidth` | `number` | `400` | Panel width in pixels |
| `panelHeight` | `number` | `300` | Panel height in pixels |
| `defaultProvider` | `'google' \| 'mapillary'` | `'google'` | Default imagery provider |
| `googleApiKey` | `string` | - | Google Maps API key |
| `mapillaryAccessToken` | `string` | - | Mapillary access token |
| `clickToView` | `boolean` | `true` | Enable click-to-view on map |
| `showMarker` | `boolean` | `true` | Show marker at view location |
| `maxSearchRadius` | `number` | `100` | Max search radius for nearest imagery (meters) |
| `markerOptions` | `MarkerOptions` | - | Customize marker appearance |

### MarkerOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `color` | `string` | `'#ff5722'` | Marker dot color |
| `showDirection` | `boolean` | `true` | Show direction indicator |
| `directionColor` | `string` | `'#1976d2'` | Direction arrow color |

## Events

| Event | Description |
|-------|-------------|
| `expand` | Panel expanded |
| `collapse` | Panel collapsed |
| `statechange` | Any state change |
| `providerchange` | Provider switched |
| `locationchange` | View location changed |
| `headingchange` | View heading changed |
| `load` | Imagery loaded |
| `error` | Error occurred |

```typescript
streetView.on('statechange', (event) => {
  console.log('State:', event.state);
});

streetView.on('error', (event) => {
  console.error('Error:', event.error);
});
```

## Methods

| Method | Description |
|--------|-------------|
| `toggle()` | Toggle panel visibility |
| `expand()` | Expand the panel |
| `collapse()` | Collapse the panel |
| `setProvider(provider)` | Switch to a provider |
| `showStreetView(lngLat)` | Show street view at location |
| `clearStreetView()` | Clear current street view |
| `getState()` | Get current state |

## React Hooks

### useStreetViewState

State management hook for the street view control.

```typescript
const {
  state,
  toggle,
  expand,
  collapse,
  setProvider,
  setLoading,
  reset,
} = useStreetViewState({ collapsed: true });
```

### useStreetViewProvider

Provider configuration helper hook.

```typescript
const {
  availableProviders,
  isProviderAvailable,
  getDefaultProvider,
  hasAnyProvider,
} = useStreetViewProvider({
  google: { enabled: true, apiKey: 'key' },
  mapillary: { enabled: true, accessToken: 'token' },
});
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build library
npm run build

# Build examples
npm run build:examples
```

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_api_key
VITE_MAPILLARY_ACCESS_TOKEN=your_mapillary_token
```

## Live Demo

Visit the [GitHub Pages demo](https://opengeos.github.io/maplibre-gl-streetview/) to see the plugin in action.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

[Qiusheng Wu](https://github.com/giswqs)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
