import { CSS_CLASSES } from '../core/constants';
import { createElement } from '../utils/helpers';

/**
 * Values submitted from the API key input form.
 */
export interface ApiKeyValues {
  googleApiKey: string;
  mapillaryAccessToken: string;
}

/**
 * Options for the API key input component.
 */
export interface ApiKeyInputsOptions extends ApiKeyValues {
  onApply: (values: ApiKeyValues) => void;
}

/**
 * API key entry form for configuring providers at runtime.
 */
export class ApiKeyInputs {
  private _element: HTMLFormElement;
  private _googleInput: HTMLInputElement;
  private _mapillaryInput: HTMLInputElement;
  private _onApply: (values: ApiKeyValues) => void;

  constructor(options: ApiKeyInputsOptions) {
    this._onApply = options.onApply;
    this._element = this.createForm();
    this._googleInput = this.createInput(
      'Google Maps API key',
      'Enter Google Maps API key',
      options.googleApiKey
    );
    this._mapillaryInput = this.createInput(
      'Mapillary access token',
      'Enter Mapillary access token',
      options.mapillaryAccessToken
    );

    this._element.appendChild(this.createField('Google Maps API key', this._googleInput));
    this._element.appendChild(this.createField('Mapillary access token', this._mapillaryInput));
    this._element.appendChild(this.createApplyButton());
  }

  private createForm(): HTMLFormElement {
    const form = document.createElement('form');
    form.className = CSS_CLASSES.API_KEYS;
    form.setAttribute('aria-label', 'Street view API keys');

    form.addEventListener('submit', this.handleSubmit);

    for (const eventName of ['click', 'dblclick', 'mousedown', 'touchstart', 'wheel']) {
      form.addEventListener(eventName, this.stopPropagation);
    }

    return form;
  }

  private createField(labelText: string, input: HTMLInputElement): HTMLElement {
    const label = createElement('label', { className: CSS_CLASSES.API_KEY_FIELD });
    const labelSpan = createElement('span', { className: CSS_CLASSES.API_KEY_LABEL }, [labelText]);
    label.appendChild(labelSpan);
    label.appendChild(input);
    return label;
  }

  private createInput(label: string, placeholder: string, value: string): HTMLInputElement {
    const input = document.createElement('input');
    input.className = CSS_CLASSES.API_KEY_INPUT;
    input.type = 'password';
    input.placeholder = placeholder;
    input.value = value;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('aria-label', label);
    return input;
  }

  private createApplyButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = CSS_CLASSES.API_KEY_APPLY;
    button.type = 'submit';
    button.textContent = 'Apply keys';
    return button;
  }

  private handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    this._onApply(this.getValues());
  };

  private stopPropagation = (event: Event): void => {
    event.stopPropagation();
  };

  getElement(): HTMLElement {
    return this._element;
  }

  getValues(): ApiKeyValues {
    return {
      googleApiKey: this._googleInput.value.trim(),
      mapillaryAccessToken: this._mapillaryInput.value.trim(),
    };
  }

  setValues(values: Partial<ApiKeyValues>): void {
    if (values.googleApiKey !== undefined) {
      this._googleInput.value = values.googleApiKey;
    }
    if (values.mapillaryAccessToken !== undefined) {
      this._mapillaryInput.value = values.mapillaryAccessToken;
    }
  }

  destroy(): void {
    this._element.removeEventListener('submit', this.handleSubmit);
    for (const eventName of ['click', 'dblclick', 'mousedown', 'touchstart', 'wheel']) {
      this._element.removeEventListener(eventName, this.stopPropagation);
    }
    this._element.remove();
  }
}
