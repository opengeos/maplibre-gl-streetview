/**
 * Clamps a number between a minimum and maximum value.
 *
 * @param value - The value to clamp
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generates a random ID with an optional prefix.
 *
 * @param prefix - Optional prefix for the ID
 * @returns A random ID string
 */
export function generateId(prefix = 'streetview'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Debounces a function call.
 *
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttles a function call.
 *
 * @param fn - The function to throttle
 * @param limit - The minimum time between calls in milliseconds
 * @returns The throttled function
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Converts a class name object to a string.
 *
 * @param classes - Object with class names as keys and booleans as values
 * @returns A string of class names
 */
export function classNames(classes: Record<string, boolean>): string {
  return Object.entries(classes)
    .filter(([, active]) => active)
    .map(([className]) => className)
    .join(' ');
}

/**
 * Normalizes a heading value to the range 0-360.
 *
 * @param heading - The heading value to normalize
 * @returns The normalized heading (0-360)
 */
export function normalizeHeading(heading: number): number {
  let normalized = heading % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  // Convert -0 to 0
  return normalized || 0;
}

/**
 * Creates a simple DOM element with optional attributes and children.
 *
 * @param tag - The HTML tag name
 * @param attributes - Optional attributes to set on the element
 * @param children - Optional children to append
 * @returns The created element
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes?: Record<string, string>,
  children?: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'className') {
        element.className = value;
      } else {
        element.setAttribute(key, value);
      }
    }
  }

  if (children) {
    for (const child of children) {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    }
  }

  return element;
}
