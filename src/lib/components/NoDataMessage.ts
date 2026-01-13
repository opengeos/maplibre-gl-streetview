import { CSS_CLASSES } from '../core/constants';
import type { ProviderType } from '../core/types';
import { createElement } from '../utils/helpers';

/**
 * Options for the NoDataMessage component.
 */
export interface NoDataMessageOptions {
  provider?: ProviderType;
  onSearchNearest?: () => void;
  showSearchButton?: boolean;
}

/**
 * No data/coverage message component.
 * Displays when no street view imagery is available at a location.
 */
export class NoDataMessage {
  private _element: HTMLElement;
  private _titleEl: HTMLElement;
  private _messageEl: HTMLElement;
  private _buttonEl: HTMLButtonElement | null = null;
  private _onSearchNearest?: () => void;

  /**
   * Creates a new NoDataMessage instance.
   *
   * @param options - Component configuration options
   */
  constructor(options: NoDataMessageOptions = {}) {
    this._onSearchNearest = options.onSearchNearest;
    this._element = this.createMessage(options);
    this._titleEl = this._element.querySelector(`.${CSS_CLASSES.NO_DATA_TITLE}`)!;
    this._messageEl = this._element.querySelector(`.${CSS_CLASSES.NO_DATA_MESSAGE}`)!;
    this._buttonEl = this._element.querySelector(`.${CSS_CLASSES.NO_DATA_BUTTON}`);
  }

  /**
   * Creates the message container element.
   */
  private createMessage(options: NoDataMessageOptions): HTMLElement {
    const container = createElement('div', { className: CSS_CLASSES.NO_DATA });

    // Icon
    const icon = createElement('div', { className: CSS_CLASSES.NO_DATA_ICON });
    icon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        <path d="M0 0h24v24H0z" fill="none"/>
        <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="2"/>
      </svg>
    `;

    // Title
    const title = createElement('div', { className: CSS_CLASSES.NO_DATA_TITLE }, [
      'No Street View Coverage',
    ]);

    // Message
    const providerName = options.provider === 'mapillary' ? 'Mapillary' : 'Google Street View';
    const message = createElement('div', { className: CSS_CLASSES.NO_DATA_MESSAGE }, [
      `${providerName} imagery is not available at this location.`,
    ]);

    container.appendChild(icon);
    container.appendChild(title);
    container.appendChild(message);

    // Search button
    if (options.showSearchButton !== false && options.onSearchNearest) {
      const actionContainer = createElement('div', { className: CSS_CLASSES.NO_DATA_ACTION });

      const button = document.createElement('button');
      button.className = CSS_CLASSES.NO_DATA_BUTTON;
      button.textContent = 'Search Nearby';
      button.addEventListener('click', () => {
        this._onSearchNearest?.();
      });

      actionContainer.appendChild(button);
      container.appendChild(actionContainer);
    }

    return container;
  }

  /**
   * Gets the message container element.
   */
  getElement(): HTMLElement {
    return this._element;
  }

  /**
   * Sets the title text.
   *
   * @param title - The new title
   */
  setTitle(title: string): void {
    this._titleEl.textContent = title;
  }

  /**
   * Sets the message text.
   *
   * @param message - The new message
   */
  setMessage(message: string): void {
    this._messageEl.textContent = message;
  }

  /**
   * Shows the searching state.
   */
  showSearching(): void {
    this._element.classList.add('searching');
    this._titleEl.textContent = 'Searching Nearby...';
    this._messageEl.textContent = 'Looking for available imagery in the area.';
    if (this._buttonEl) {
      this._buttonEl.disabled = true;
      this._buttonEl.textContent = 'Searching...';
    }
  }

  /**
   * Shows the not found state after searching.
   */
  showNotFound(): void {
    this._element.classList.remove('searching');
    this._titleEl.textContent = 'No Nearby Coverage';
    this._messageEl.textContent = 'No street view imagery was found in this area. Try a different location.';
    if (this._buttonEl) {
      this._buttonEl.disabled = false;
      this._buttonEl.textContent = 'Search Nearby';
    }
  }

  /**
   * Shows an error state.
   *
   * @param errorMessage - The error message to display
   */
  showError(errorMessage: string): void {
    this._element.classList.remove('searching');
    this._element.classList.add('error');
    this._titleEl.textContent = 'Error';
    this._messageEl.textContent = errorMessage;
    if (this._buttonEl) {
      this._buttonEl.disabled = false;
      this._buttonEl.textContent = 'Try Again';
    }
  }

  /**
   * Resets to the default state.
   *
   * @param provider - The current provider
   */
  reset(provider?: ProviderType): void {
    this._element.classList.remove('searching', 'error');
    this._titleEl.textContent = 'No Street View Coverage';
    const providerName = provider === 'mapillary' ? 'Mapillary' : 'Google Street View';
    this._messageEl.textContent = `${providerName} imagery is not available at this location.`;
    if (this._buttonEl) {
      this._buttonEl.disabled = false;
      this._buttonEl.textContent = 'Search Nearby';
    }
  }

  /**
   * Cleans up the component.
   */
  destroy(): void {
    this._element.remove();
  }
}
