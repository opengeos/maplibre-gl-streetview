import { CSS_CLASSES, DEFAULT_OPTIONS } from '../core/constants';
import type { ControlPosition } from '../core/types';
import { createElement } from '../utils/helpers';

/**
 * Options for the Panel component.
 */
export interface PanelOptions {
  title?: string;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  position?: ControlPosition;
  onClose?: () => void;
  onResize?: (width: number, height: number) => void;
}

/**
 * Collapsible and resizable panel component for displaying street view content.
 */
export class Panel {
  private _element: HTMLElement;
  private _header: HTMLElement;
  private _titleEl: HTMLElement;
  private _content: HTMLElement;
  private _resizeHandle: HTMLElement;

  private _width: number;
  private _height: number;
  private _minWidth: number;
  private _minHeight: number;
  private _position: ControlPosition;
  private _onClose?: () => void;
  private _onResize?: (width: number, height: number) => void;

  private _isResizing = false;
  private _startX = 0;
  private _startY = 0;
  private _startWidth = 0;
  private _startHeight = 0;
  private _mapContainer: HTMLElement | null = null;
  private _button: HTMLElement | null = null;
  private _onWindowResize: () => void;

  /**
   * Creates a new Panel instance.
   *
   * @param options - Panel configuration options
   */
  constructor(options: PanelOptions = {}) {
    this._width = options.width ?? DEFAULT_OPTIONS.panelWidth;
    this._height = options.height ?? DEFAULT_OPTIONS.panelHeight;
    this._minWidth = options.minWidth ?? DEFAULT_OPTIONS.minPanelWidth;
    this._minHeight = options.minHeight ?? DEFAULT_OPTIONS.minPanelHeight;
    this._position = options.position ?? DEFAULT_OPTIONS.position;
    this._onClose = options.onClose;
    this._onResize = options.onResize;

    this._element = this.createPanel();
    this._header = this.createHeader(options.title);
    this._titleEl = this._header.querySelector(`.${CSS_CLASSES.PANEL_TITLE}`)!;
    this._content = this.createContent();
    this._resizeHandle = this.createResizeHandle();

    this._element.appendChild(this._header);
    this._element.appendChild(this._content);
    this._element.appendChild(this._resizeHandle);

    this.setupResizeHandlers();

    // Setup window resize handler
    this._onWindowResize = this.handleWindowResize.bind(this);
    window.addEventListener('resize', this._onWindowResize);
  }

  /**
   * Creates the main panel element.
   */
  private createPanel(): HTMLElement {
    const panel = createElement('div', {
      className: CSS_CLASSES.PANEL,
    });
    panel.style.width = `${this._width}px`;
    panel.style.height = `${this._height}px`;
    panel.dataset.position = this._position;
    return panel;
  }

  /**
   * Creates the panel header with title and close button.
   */
  private createHeader(title?: string): HTMLElement {
    const header = createElement('div', { className: CSS_CLASSES.PANEL_HEADER });

    const titleEl = createElement('span', { className: CSS_CLASSES.PANEL_TITLE }, [
      title ?? DEFAULT_OPTIONS.title,
    ]);

    const closeBtn = createElement('button', {
      className: CSS_CLASSES.PANEL_CLOSE,
      'aria-label': 'Close panel',
    });
    closeBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    `;
    closeBtn.addEventListener('click', () => this._onClose?.());

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    return header;
  }

  /**
   * Creates the content container.
   */
  private createContent(): HTMLElement {
    return createElement('div', { className: CSS_CLASSES.PANEL_CONTENT });
  }

  /**
   * Creates the resize handle.
   */
  private createResizeHandle(): HTMLElement {
    const handle = createElement('div', { className: CSS_CLASSES.PANEL_RESIZE });
    return handle;
  }

  /**
   * Sets up resize event handlers.
   */
  private setupResizeHandlers(): void {
    this._resizeHandle.addEventListener('mousedown', this.onResizeStart);
    document.addEventListener('mousemove', this.onResizeMove);
    document.addEventListener('mouseup', this.onResizeEnd);
  }

  /**
   * Handles resize start.
   */
  private onResizeStart = (e: MouseEvent): void => {
    e.preventDefault();
    this._isResizing = true;
    this._startX = e.clientX;
    this._startY = e.clientY;
    this._startWidth = this._width;
    this._startHeight = this._height;
    document.body.style.cursor = 'se-resize';
    document.body.style.userSelect = 'none';
  };

  /**
   * Gets the maximum allowed panel dimensions based on viewport/container.
   */
  private getMaxDimensions(): { maxWidth: number; maxHeight: number } {
    if (this._mapContainer) {
      const rect = this._mapContainer.getBoundingClientRect();
      // Leave some padding around the edges
      return {
        maxWidth: rect.width - 40,
        maxHeight: rect.height - 80,
      };
    }
    // Fallback to viewport dimensions
    return {
      maxWidth: window.innerWidth - 40,
      maxHeight: window.innerHeight - 80,
    };
  }

  /**
   * Handles resize movement.
   */
  private onResizeMove = (e: MouseEvent): void => {
    if (!this._isResizing) return;

    const deltaX = e.clientX - this._startX;
    const deltaY = e.clientY - this._startY;

    // Adjust delta based on panel position
    let newWidth = this._startWidth;
    let newHeight = this._startHeight;

    if (this._position.includes('right')) {
      newWidth = this._startWidth - deltaX;
    } else {
      newWidth = this._startWidth + deltaX;
    }

    if (this._position.includes('bottom')) {
      newHeight = this._startHeight - deltaY;
    } else {
      newHeight = this._startHeight + deltaY;
    }

    // Get max dimensions
    const { maxWidth, maxHeight } = this.getMaxDimensions();

    // Apply minimum and maximum constraints
    newWidth = Math.max(this._minWidth, Math.min(maxWidth, newWidth));
    newHeight = Math.max(this._minHeight, Math.min(maxHeight, newHeight));

    // Calculate the width and height change
    const widthDiff = newWidth - this._width;
    const heightDiff = newHeight - this._height;

    // Update size
    this.setSize(newWidth, newHeight);

    // Adjust position for right-positioned panels (panel grows to the left)
    if (this._position.includes('right') && widthDiff !== 0) {
      const currentLeft = parseFloat(this._element.style.left) || 0;
      const newLeft = Math.max(10, currentLeft - widthDiff);
      this._element.style.left = `${newLeft}px`;
    }

    // Adjust position for bottom-positioned panels (panel grows upward)
    if (this._position.includes('bottom') && heightDiff !== 0) {
      const currentTop = parseFloat(this._element.style.top) || 0;
      const newTop = Math.max(10, currentTop - heightDiff);
      this._element.style.top = `${newTop}px`;
    }
  };

  /**
   * Handles resize end.
   */
  private onResizeEnd = (): void => {
    if (!this._isResizing) return;
    this._isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    this._onResize?.(this._width, this._height);
  };

  /**
   * Gets the panel element.
   */
  getElement(): HTMLElement {
    return this._element;
  }

  /**
   * Gets the content container element.
   */
  getContent(): HTMLElement {
    return this._content;
  }

  /**
   * Sets the panel title.
   *
   * @param title - The new title
   */
  setTitle(title: string): void {
    this._titleEl.textContent = title;
  }

  /**
   * Sets the panel size.
   *
   * @param width - Width in pixels
   * @param height - Height in pixels
   */
  setSize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    this._element.style.width = `${width}px`;
    this._element.style.height = `${height}px`;
  }

  /**
   * Gets the current panel size.
   */
  getSize(): { width: number; height: number } {
    return { width: this._width, height: this._height };
  }

  /**
   * Sets the panel position.
   *
   * @param position - The control position
   */
  setPosition(position: ControlPosition): void {
    this._position = position;
    this._element.dataset.position = position;
  }

  /**
   * Shows the panel (adds expanded class).
   */
  show(): void {
    this._element.classList.add(CSS_CLASSES.PANEL_EXPANDED);
  }

  /**
   * Hides the panel (removes expanded class).
   */
  hide(): void {
    this._element.classList.remove(CSS_CLASSES.PANEL_EXPANDED);
  }

  /**
   * Checks if the panel is visible.
   */
  isVisible(): boolean {
    return this._element.classList.contains(CSS_CLASSES.PANEL_EXPANDED);
  }

  /**
   * Positions the panel relative to a button element.
   *
   * @param button - The toggle button element
   * @param mapContainer - The map container element
   */
  positionRelativeTo(button: HTMLElement, mapContainer: HTMLElement): void {
    // Store references for window resize handling
    this._button = button;
    this._mapContainer = mapContainer;

    this.updatePosition();
  }

  /**
   * Updates the panel position based on stored references.
   */
  private updatePosition(): void {
    if (!this._button || !this._mapContainer) return;

    const buttonRect = this._button.getBoundingClientRect();
    const mapRect = this._mapContainer.getBoundingClientRect();
    const gap = 5;

    // Get max dimensions to constrain size on resize
    const { maxWidth, maxHeight } = this.getMaxDimensions();

    // Constrain current size to max dimensions
    const constrainedWidth = Math.min(this._width, maxWidth);
    const constrainedHeight = Math.min(this._height, maxHeight);

    if (constrainedWidth !== this._width || constrainedHeight !== this._height) {
      this.setSize(constrainedWidth, constrainedHeight);
    }

    let top: number;
    let left: number;

    if (this._position.includes('top')) {
      top = buttonRect.bottom - mapRect.top + gap;
    } else {
      top = buttonRect.top - mapRect.top - this._height - gap;
    }

    if (this._position.includes('right')) {
      left = buttonRect.right - mapRect.left - this._width;
    } else {
      left = buttonRect.left - mapRect.left;
    }

    // Ensure panel stays within bounds
    const maxLeft = mapRect.width - this._width - 10;
    const maxTop = mapRect.height - this._height - 10;

    left = Math.max(10, Math.min(left, maxLeft));
    top = Math.max(10, Math.min(top, maxTop));

    this._element.style.top = `${top}px`;
    this._element.style.left = `${left}px`;
  }

  /**
   * Handles window resize events.
   */
  private handleWindowResize(): void {
    if (this.isVisible()) {
      this.updatePosition();
    }
  }

  /**
   * Cleans up event listeners.
   */
  destroy(): void {
    this._resizeHandle.removeEventListener('mousedown', this.onResizeStart);
    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.onResizeEnd);
    window.removeEventListener('resize', this._onWindowResize);
    this._mapContainer = null;
    this._button = null;
    this._element.remove();
  }
}
