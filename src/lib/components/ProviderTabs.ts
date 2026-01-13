import { CSS_CLASSES } from '../core/constants';
import type { ProviderType } from '../core/types';
import { createElement } from '../utils/helpers';

/**
 * Options for the ProviderTabs component.
 */
export interface ProviderTabsOptions {
  providers: ProviderType[];
  activeProvider: ProviderType;
  disabledProviders?: ProviderType[];
  onSelect: (provider: ProviderType) => void;
}

/**
 * Provider selection tabs component.
 * Allows users to switch between Google Street View and Mapillary.
 */
export class ProviderTabs {
  private _element: HTMLElement;
  private _providers: ProviderType[];
  private _activeProvider: ProviderType;
  private _disabledProviders: Set<ProviderType>;
  private _onSelect: (provider: ProviderType) => void;
  private _tabs: Map<ProviderType, HTMLButtonElement> = new Map();

  /**
   * Creates a new ProviderTabs instance.
   *
   * @param options - Tab configuration options
   */
  constructor(options: ProviderTabsOptions) {
    this._providers = options.providers;
    this._activeProvider = options.activeProvider;
    this._disabledProviders = new Set(options.disabledProviders ?? []);
    this._onSelect = options.onSelect;

    this._element = this.createTabs();
  }

  /**
   * Creates the tabs container with tab buttons.
   */
  private createTabs(): HTMLElement {
    const container = createElement('div', { className: CSS_CLASSES.PROVIDER_TABS });

    if (this._providers.length === 1) {
      container.classList.add('single-provider');
    }

    for (const provider of ['google', 'mapillary'] as ProviderType[]) {
      const tab = this.createTab(provider);
      this._tabs.set(provider, tab);
      container.appendChild(tab);
    }

    return container;
  }

  /**
   * Creates a single tab button.
   */
  private createTab(provider: ProviderType): HTMLButtonElement {
    const isAvailable = this._providers.includes(provider);
    const isActive = provider === this._activeProvider;
    const isDisabled = this._disabledProviders.has(provider) || !isAvailable;

    const tab = document.createElement('button');
    tab.className = CSS_CLASSES.PROVIDER_TAB;
    tab.dataset.provider = provider;

    if (isActive) {
      tab.classList.add(CSS_CLASSES.PROVIDER_TAB_ACTIVE);
    }

    if (isDisabled) {
      tab.disabled = true;
    }

    // Provider icon
    const icon = createElement('span', { className: 'provider-icon' });
    icon.innerHTML = this.getProviderIcon(provider);

    // Provider label
    const label = createElement('span', { className: 'provider-label' }, [
      this.getProviderLabel(provider),
    ]);

    tab.appendChild(icon);
    tab.appendChild(label);

    tab.addEventListener('click', () => {
      if (!tab.disabled) {
        this.setActive(provider);
        this._onSelect(provider);
      }
    });

    return tab;
  }

  /**
   * Gets the icon SVG for a provider.
   */
  private getProviderIcon(provider: ProviderType): string {
    if (provider === 'google') {
      return `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `;
    }
    return `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    `;
  }

  /**
   * Gets the display label for a provider.
   */
  private getProviderLabel(provider: ProviderType): string {
    return provider === 'google' ? 'Google' : 'Mapillary';
  }

  /**
   * Gets the tabs container element.
   */
  getElement(): HTMLElement {
    return this._element;
  }

  /**
   * Sets the active provider tab.
   *
   * @param provider - The provider to activate
   */
  setActive(provider: ProviderType): void {
    if (this._activeProvider === provider) return;

    // Remove active class from current tab
    const currentTab = this._tabs.get(this._activeProvider);
    if (currentTab) {
      currentTab.classList.remove(CSS_CLASSES.PROVIDER_TAB_ACTIVE);
    }

    // Add active class to new tab
    const newTab = this._tabs.get(provider);
    if (newTab && !newTab.disabled) {
      newTab.classList.add(CSS_CLASSES.PROVIDER_TAB_ACTIVE);
      this._activeProvider = provider;
    }
  }

  /**
   * Gets the currently active provider.
   */
  getActive(): ProviderType {
    return this._activeProvider;
  }

  /**
   * Enables or disables a provider tab.
   *
   * @param provider - The provider to update
   * @param enabled - Whether to enable the tab
   */
  setEnabled(provider: ProviderType, enabled: boolean): void {
    const tab = this._tabs.get(provider);
    if (tab) {
      tab.disabled = !enabled;
      if (enabled) {
        this._disabledProviders.delete(provider);
      } else {
        this._disabledProviders.add(provider);
      }
    }
  }

  /**
   * Updates the available providers.
   *
   * @param providers - Array of available providers
   */
  setProviders(providers: ProviderType[]): void {
    this._providers = providers;
    for (const [provider, tab] of this._tabs) {
      const isAvailable = providers.includes(provider);
      tab.disabled = !isAvailable || this._disabledProviders.has(provider);
    }

    if (providers.length === 1) {
      this._element.classList.add('single-provider');
    } else {
      this._element.classList.remove('single-provider');
    }
  }

  /**
   * Cleans up the component.
   */
  destroy(): void {
    this._element.remove();
    this._tabs.clear();
  }
}
