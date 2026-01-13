import type { IControl, Map as MapLibreMap, MapMouseEvent, LngLat } from 'maplibre-gl';
import type {
  StreetViewControlOptions,
  StreetViewState,
  StreetViewEvent,
  StreetViewEventHandler,
  StreetViewEventData,
  ProviderType,
  ControlPosition,
  IStreetViewProvider,
} from './types';
import { DEFAULT_OPTIONS, CSS_CLASSES } from './constants';
import { Panel, ProviderTabs, Viewer, StreetViewMarker, NoDataMessage } from '../components';
import { GoogleStreetViewProvider, MapillaryProvider } from '../providers';
import { createElement, generateId } from '../utils/helpers';
import { toLngLat } from '../utils/geo';

/**
 * Street View control for MapLibre GL JS.
 * Provides a collapsible panel for viewing Google Street View and Mapillary imagery.
 */
export class StreetViewControl implements IControl {
  private _map: MapLibreMap | null = null;
  private _container: HTMLElement | null = null;
  private _button: HTMLButtonElement | null = null;
  private _options: Required<StreetViewControlOptions>;
  private _id: string;

  // UI Components
  private _panel: Panel | null = null;
  private _tabs: ProviderTabs | null = null;
  private _viewer: Viewer | null = null;
  private _noDataMessage: NoDataMessage | null = null;
  private _marker: StreetViewMarker | null = null;

  // Providers
  private _googleProvider: GoogleStreetViewProvider | null = null;
  private _mapillaryProvider: MapillaryProvider | null = null;

  // State
  private _state: StreetViewState = {
    collapsed: true,
    activeProvider: 'google',
    location: null,
    imagery: null,
    heading: 0,
    pitch: 0,
    loading: false,
    error: null,
  };

  // Event handlers
  private _eventHandlers: Map<StreetViewEvent, Set<StreetViewEventHandler>> = new Map();

  // Bound handlers for cleanup
  private _onMapClick: (e: MapMouseEvent) => void;

  /**
   * Creates a new StreetViewControl.
   *
   * @param options - Control configuration options
   */
  constructor(options: StreetViewControlOptions = {}) {
    this._options = { ...DEFAULT_OPTIONS, ...options } as Required<StreetViewControlOptions>;
    this._id = generateId();

    // Initialize state from options
    this._state.collapsed = this._options.collapsed;
    this._state.activeProvider = this._options.defaultProvider;

    // Initialize providers
    if (this._options.googleApiKey) {
      this._googleProvider = new GoogleStreetViewProvider(this._options.googleApiKey);
    }
    if (this._options.mapillaryAccessToken) {
      this._mapillaryProvider = new MapillaryProvider(this._options.mapillaryAccessToken);
    }

    // Bind handlers
    this._onMapClick = this.handleMapClick.bind(this);
  }

  /**
   * Called when the control is added to the map.
   *
   * @param map - The MapLibre map instance
   * @returns The control container element
   */
  onAdd(map: MapLibreMap): HTMLElement {
    this._map = map;

    // Create container
    this._container = createElement('div', {
      className: `maplibregl-ctrl maplibregl-ctrl-group ${CSS_CLASSES.CONTROL}`,
    });

    if (this._options.className) {
      this._container.classList.add(this._options.className);
    }

    // Create toggle button
    this._button = this.createToggleButton();
    this._container.appendChild(this._button);

    // Create panel
    this._panel = new Panel({
      title: this._options.title,
      width: this._options.panelWidth,
      height: this._options.panelHeight,
      minWidth: this._options.minPanelWidth,
      minHeight: this._options.minPanelHeight,
      position: this._options.position,
      onClose: () => this.collapse(),
      onResize: (width, height) => {
        this._options.panelWidth = width;
        this._options.panelHeight = height;
      },
    });

    // Create provider tabs
    const availableProviders = this.getAvailableProviders();
    this._tabs = new ProviderTabs({
      providers: availableProviders,
      activeProvider: this._state.activeProvider,
      onSelect: (provider) => this.setProvider(provider),
    });

    // Create viewer
    this._viewer = new Viewer({
      onHeadingChange: (heading) => this.handleHeadingChange(heading),
    });

    // Assemble panel content
    const panelContent = this._panel.getContent();
    panelContent.appendChild(this._tabs.getElement());
    panelContent.appendChild(this._viewer.getElement());

    // Add panel to map container
    const mapContainer = map.getContainer();
    mapContainer.appendChild(this._panel.getElement());

    // Set initial panel state
    if (!this._state.collapsed) {
      this.expand();
    }

    // Setup map click handler
    if (this._options.clickToView) {
      map.on('click', this._onMapClick);
    }

    // Create marker if enabled
    if (this._options.showMarker) {
      this._marker = new StreetViewMarker(this._options.markerOptions);
    }

    return this._container;
  }

  /**
   * Called when the control is removed from the map.
   */
  onRemove(): void {
    // Remove map event listeners
    if (this._map && this._options.clickToView) {
      this._map.off('click', this._onMapClick);
    }

    // Destroy components
    this._panel?.destroy();
    this._tabs?.destroy();
    this._viewer?.destroy();
    this._noDataMessage?.destroy();
    this._marker?.remove();

    // Destroy providers
    this._googleProvider?.destroy();
    this._mapillaryProvider?.destroy();

    // Remove container
    this._container?.remove();

    // Clear references
    this._map = null;
    this._container = null;
    this._button = null;
    this._panel = null;
    this._tabs = null;
    this._viewer = null;
    this._noDataMessage = null;
    this._marker = null;

    // Clear event handlers
    this._eventHandlers.clear();
  }

  /**
   * Creates the toggle button element.
   */
  private createToggleButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = CSS_CLASSES.TOGGLE;
    button.type = 'button';
    button.setAttribute('aria-label', 'Toggle Street View');
    button.setAttribute('title', 'Street View');

    const icon = createElement('span', { className: CSS_CLASSES.ICON });
    icon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        <circle cx="12" cy="9" r="1.5"/>
      </svg>
    `;
    button.appendChild(icon);

    button.addEventListener('click', () => this.toggle());

    return button;
  }

  /**
   * Gets the list of available (configured) providers.
   */
  private getAvailableProviders(): ProviderType[] {
    const providers: ProviderType[] = [];
    if (this._googleProvider?.isConfigured()) {
      providers.push('google');
    }
    if (this._mapillaryProvider?.isConfigured()) {
      providers.push('mapillary');
    }
    return providers;
  }

  /**
   * Gets the current provider instance.
   */
  private getCurrentProvider(): IStreetViewProvider | null {
    if (this._state.activeProvider === 'google') {
      return this._googleProvider;
    }
    return this._mapillaryProvider;
  }

  /**
   * Handles map click events.
   */
  private handleMapClick(e: MapMouseEvent): void {
    if (this._state.collapsed) return;
    this.showStreetView(e.lngLat);
  }

  /**
   * Handles heading changes from the viewer.
   */
  private handleHeadingChange(heading: number): void {
    this._state.heading = heading;
    this._marker?.setHeading(heading);
    this.emit('headingchange');
  }

  /**
   * Updates the panel position relative to the button.
   */
  private updatePanelPosition(): void {
    if (!this._panel || !this._button || !this._map) return;
    this._panel.positionRelativeTo(this._button, this._map.getContainer());
  }

  /**
   * Shows street view imagery at a location.
   *
   * @param lngLat - The location to show
   */
  async showStreetView(lngLat: LngLat | [number, number]): Promise<void> {
    const location = toLngLat(lngLat);
    const provider = this.getCurrentProvider();

    if (!provider) {
      this.showNoData('No street view provider is configured.');
      return;
    }

    // Update state
    this._state.location = location;
    this._state.loading = true;
    this._state.error = null;
    this.emit('locationchange');

    // Show loading state
    this._viewer?.showLoading('Loading street view...');

    // Update marker position
    if (this._marker && this._map) {
      this._marker.setLngLat(location).addTo(this._map, location);
    }

    try {
      // Query for imagery
      let imagery = await provider.queryImagery(location);

      // If no imagery, search nearby
      if (!imagery) {
        this._viewer?.showLoading('Searching nearby...');
        imagery = await provider.findNearestImagery(location, this._options.maxSearchRadius);
      }

      if (imagery) {
        this._state.imagery = imagery;
        this._state.loading = false;

        // Update marker to actual imagery location
        if (this._marker && this._map) {
          this._marker.setLngLat(imagery.location);
          if (imagery.heading !== undefined) {
            this._marker.setHeading(imagery.heading);
          }
        }

        // Display imagery
        this._viewer?.displayImagery(provider, imagery);
        this.emit('load');
      } else {
        this._state.loading = false;
        this.showNoData();
      }
    } catch (error) {
      this._state.loading = false;
      this._state.error = error instanceof Error ? error.message : 'Unknown error';
      this.showNoData(this._state.error);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }

    this.emit('statechange');
  }

  /**
   * Shows the no data message.
   */
  private showNoData(errorMessage?: string): void {
    if (!this._viewer) return;

    this._viewer.clearContent();

    this._noDataMessage = new NoDataMessage({
      provider: this._state.activeProvider,
      showSearchButton: true,
      onSearchNearest: () => this.searchNearest(),
    });

    if (errorMessage) {
      this._noDataMessage.showError(errorMessage);
    }

    this._viewer.getElement().appendChild(this._noDataMessage.getElement());
  }

  /**
   * Searches for the nearest imagery with larger radius.
   */
  private async searchNearest(): Promise<void> {
    if (!this._state.location) return;

    const provider = this.getCurrentProvider();
    if (!provider) return;

    this._noDataMessage?.showSearching();

    try {
      const imagery = await provider.findNearestImagery(this._state.location, 500);

      if (imagery) {
        this._state.imagery = imagery;

        // Update marker
        if (this._marker && this._map) {
          this._marker.setLngLat(imagery.location);
          if (imagery.heading !== undefined) {
            this._marker.setHeading(imagery.heading);
          }
        }

        // Remove no data message and show imagery
        this._noDataMessage?.destroy();
        this._noDataMessage = null;
        this._viewer?.displayImagery(provider, imagery);
        this.emit('load');
      } else {
        this._noDataMessage?.showNotFound();
      }
    } catch (error) {
      this._noDataMessage?.showError(error instanceof Error ? error.message : 'Search failed');
    }

    this.emit('statechange');
  }

  /**
   * Clears the current street view display.
   */
  clearStreetView(): void {
    this._state.location = null;
    this._state.imagery = null;
    this._state.heading = 0;
    this._state.error = null;

    this._viewer?.showInitialState();
    this._marker?.remove();
    this._noDataMessage?.destroy();
    this._noDataMessage = null;

    this.emit('statechange');
  }

  /**
   * Sets the active provider.
   *
   * @param provider - The provider to activate
   */
  setProvider(provider: ProviderType): void {
    if (this._state.activeProvider === provider) return;

    this._state.activeProvider = provider;
    this._tabs?.setActive(provider);

    // Re-query if we have a location
    if (this._state.location) {
      this.showStreetView(this._state.location);
    } else {
      this._viewer?.showInitialState();
    }

    this.emit('providerchange');
    this.emit('statechange');
  }

  /**
   * Expands the panel.
   */
  expand(): void {
    if (!this._state.collapsed) return;

    this._state.collapsed = false;
    this._panel?.show();
    this._container?.classList.add('active');
    this.updatePanelPosition();

    this.emit('expand');
    this.emit('statechange');
  }

  /**
   * Collapses the panel.
   */
  collapse(): void {
    if (this._state.collapsed) return;

    this._state.collapsed = true;
    this._panel?.hide();
    this._container?.classList.remove('active');

    this.emit('collapse');
    this.emit('statechange');
  }

  /**
   * Toggles the panel visibility.
   */
  toggle(): void {
    if (this._state.collapsed) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  /**
   * Gets the current control state.
   */
  getState(): StreetViewState {
    return { ...this._state };
  }

  /**
   * Subscribes to control events.
   *
   * @param event - The event type
   * @param handler - The event handler
   */
  on(event: StreetViewEvent, handler: StreetViewEventHandler): this {
    if (!this._eventHandlers.has(event)) {
      this._eventHandlers.set(event, new Set());
    }
    this._eventHandlers.get(event)!.add(handler);
    return this;
  }

  /**
   * Unsubscribes from control events.
   *
   * @param event - The event type
   * @param handler - The event handler to remove
   */
  off(event: StreetViewEvent, handler: StreetViewEventHandler): this {
    this._eventHandlers.get(event)?.delete(handler);
    return this;
  }

  /**
   * Emits an event to all subscribers.
   */
  private emit(event: StreetViewEvent, error?: Error): void {
    const handlers = this._eventHandlers.get(event);
    if (!handlers) return;

    const eventData: StreetViewEventData = {
      type: event,
      state: this.getState(),
      error,
    };

    for (const handler of handlers) {
      handler(eventData);
    }
  }

  /**
   * Gets the control ID.
   */
  getId(): string {
    return this._id;
  }

  /**
   * Gets the map instance.
   */
  getMap(): MapLibreMap | null {
    return this._map;
  }

  /**
   * Gets the default position for the control.
   */
  getDefaultPosition(): ControlPosition {
    return this._options.position;
  }
}
