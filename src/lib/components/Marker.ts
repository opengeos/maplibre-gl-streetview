import { Marker as MapLibreMarker, type LngLatLike, type Map as MapLibreMap } from 'maplibre-gl';
import { CSS_CLASSES, DEFAULT_MARKER_OPTIONS } from '../core/constants';
import type { MarkerOptions } from '../core/types';
import { createElement, normalizeHeading } from '../utils/helpers';

/**
 * Street view location marker with direction indicator.
 */
export class StreetViewMarker {
  private _marker: MapLibreMarker;
  private _element: HTMLElement;
  private _direction: HTMLElement;
  private _heading = 0;
  private _showDirection: boolean;

  /**
   * Creates a new StreetViewMarker.
   *
   * @param options - Marker configuration options
   */
  constructor(options: MarkerOptions = {}) {
    const mergedOptions = { ...DEFAULT_MARKER_OPTIONS, ...options };

    this._showDirection = mergedOptions.showDirection;
    this._element = this.createMarkerElement(mergedOptions);
    this._direction = this._element.querySelector(`.${CSS_CLASSES.MARKER_DIRECTION}`)!;

    this._marker = new MapLibreMarker({
      element: this._element,
      anchor: 'center',
    });
  }

  /**
   * Creates the marker DOM element.
   */
  private createMarkerElement(options: Required<MarkerOptions>): HTMLElement {
    const marker = createElement('div', { className: CSS_CLASSES.MARKER });

    // Set CSS custom properties for colors
    marker.style.setProperty('--marker-color', options.color);
    marker.style.setProperty('--marker-direction-color', options.directionColor);

    if (!options.showDirection) {
      marker.classList.add('no-direction');
    }

    // Direction indicator (arrow)
    const direction = createElement('div', { className: CSS_CLASSES.MARKER_DIRECTION });

    // Center dot
    const dot = createElement('div', { className: CSS_CLASSES.MARKER_DOT });

    marker.appendChild(direction);
    marker.appendChild(dot);

    return marker;
  }

  /**
   * Adds the marker to a map at a specific location.
   *
   * @param map - The MapLibre map instance
   * @param lngLat - The location to place the marker
   */
  addTo(map: MapLibreMap, lngLat: LngLatLike): this {
    this._marker.setLngLat(lngLat).addTo(map);
    return this;
  }

  /**
   * Removes the marker from the map.
   */
  remove(): this {
    this._marker.remove();
    return this;
  }

  /**
   * Updates the marker location.
   *
   * @param lngLat - The new location
   */
  setLngLat(lngLat: LngLatLike): this {
    this._marker.setLngLat(lngLat);
    return this;
  }

  /**
   * Sets the marker heading/direction.
   *
   * @param heading - The heading in degrees (0-360)
   */
  setHeading(heading: number): this {
    this._heading = normalizeHeading(heading);
    if (this._showDirection) {
      this._direction.style.transform = `translateX(-50%) rotate(${this._heading}deg)`;
    }
    return this;
  }

  /**
   * Gets the current heading.
   */
  getHeading(): number {
    return this._heading;
  }

  /**
   * Shows or hides the direction indicator.
   *
   * @param show - Whether to show the direction indicator
   */
  setDirectionVisible(show: boolean): this {
    this._showDirection = show;
    if (show) {
      this._element.classList.remove('no-direction');
      this._direction.style.transform = `translateX(-50%) rotate(${this._heading}deg)`;
    } else {
      this._element.classList.add('no-direction');
    }
    return this;
  }

  /**
   * Sets the marker as selected (adds pulse animation).
   *
   * @param selected - Whether the marker is selected
   */
  setSelected(selected: boolean): this {
    if (selected) {
      this._element.classList.add('selected');
    } else {
      this._element.classList.remove('selected');
    }
    return this;
  }

  /**
   * Sets the marker color.
   *
   * @param color - The marker color
   */
  setColor(color: string): this {
    this._element.style.setProperty('--marker-color', color);
    return this;
  }

  /**
   * Sets the direction indicator color.
   *
   * @param color - The direction color
   */
  setDirectionColor(color: string): this {
    this._element.style.setProperty('--marker-direction-color', color);
    return this;
  }

  /**
   * Gets the underlying MapLibre marker.
   */
  getMarker(): MapLibreMarker {
    return this._marker;
  }

  /**
   * Gets the marker DOM element.
   */
  getElement(): HTMLElement {
    return this._element;
  }
}
