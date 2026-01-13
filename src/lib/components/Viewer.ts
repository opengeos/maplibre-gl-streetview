import { CSS_CLASSES } from '../core/constants';
import type { ImageryResult, IStreetViewProvider } from '../core/types';
import { createElement } from '../utils/helpers';

/**
 * Options for the Viewer component.
 */
export interface ViewerOptions {
  onHeadingChange?: (heading: number) => void;
}

/**
 * Viewer container component that wraps provider-specific viewers.
 */
export class Viewer {
  private _element: HTMLElement;
  private _loadingEl: HTMLElement | null = null;
  private _initialEl: HTMLElement | null = null;
  private _currentProvider: IStreetViewProvider | null = null;
  private _onHeadingChange?: (heading: number) => void;
  private _headingCallback = (heading: number) => {
    this._onHeadingChange?.(heading);
  };

  /**
   * Creates a new Viewer instance.
   *
   * @param options - Viewer configuration options
   */
  constructor(options: ViewerOptions = {}) {
    this._onHeadingChange = options.onHeadingChange;
    this._element = this.createViewer();
    this.showInitialState();
  }

  /**
   * Creates the viewer container element.
   */
  private createViewer(): HTMLElement {
    return createElement('div', { className: CSS_CLASSES.VIEWER });
  }

  /**
   * Shows the initial state (click prompt).
   */
  showInitialState(): void {
    this.clearContent();

    this._initialEl = createElement('div', { className: 'streetview-viewer-initial' });

    const icon = createElement('div', { className: 'streetview-viewer-initial-icon' });
    icon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
      </svg>
    `;

    const text = createElement('div', { className: 'streetview-viewer-initial-text' }, [
      'Click anywhere on the map',
    ]);

    const hint = createElement('div', { className: 'streetview-viewer-initial-hint' }, [
      'to view street-level imagery',
    ]);

    this._initialEl.appendChild(icon);
    this._initialEl.appendChild(text);
    this._initialEl.appendChild(hint);

    this._element.appendChild(this._initialEl);
  }

  /**
   * Shows the loading state.
   *
   * @param message - Optional loading message
   */
  showLoading(message = 'Loading...'): void {
    this.hideLoading();

    this._loadingEl = createElement('div', { className: CSS_CLASSES.VIEWER_LOADING });

    const spinner = createElement('div', { className: CSS_CLASSES.SPINNER });
    const text = createElement('div', { className: 'streetview-viewer-loading-text' }, [message]);

    this._loadingEl.appendChild(spinner);
    this._loadingEl.appendChild(text);

    this._element.appendChild(this._loadingEl);
  }

  /**
   * Hides the loading state.
   */
  hideLoading(): void {
    if (this._loadingEl) {
      this._loadingEl.remove();
      this._loadingEl = null;
    }
  }

  /**
   * Clears all content from the viewer.
   */
  clearContent(): void {
    this.hideLoading();
    if (this._initialEl) {
      this._initialEl.remove();
      this._initialEl = null;
    }
    if (this._currentProvider) {
      this._currentProvider.offHeadingChange(this._headingCallback);
      this._currentProvider.destroy();
      this._currentProvider = null;
    }
    // Clear any remaining children (provider content)
    while (this._element.firstChild) {
      this._element.removeChild(this._element.firstChild);
    }
  }

  /**
   * Displays imagery using a provider.
   *
   * @param provider - The street view provider
   * @param imagery - The imagery to display
   */
  displayImagery(provider: IStreetViewProvider, imagery: ImageryResult): void {
    this.clearContent();

    this._currentProvider = provider;
    provider.onHeadingChange(this._headingCallback);
    provider.render(this._element, imagery);
  }

  /**
   * Gets the viewer container element.
   */
  getElement(): HTMLElement {
    return this._element;
  }

  /**
   * Gets the current provider.
   */
  getCurrentProvider(): IStreetViewProvider | null {
    return this._currentProvider;
  }

  /**
   * Checks if the viewer has content displayed.
   */
  hasContent(): boolean {
    return this._currentProvider !== null;
  }

  /**
   * Cleans up the component.
   */
  destroy(): void {
    this.clearContent();
    this._element.remove();
  }
}
