/**
 * Focus-trap helpers matching `ui-confirm-dialog` keyboard behavior.
 * Keep the selector and Tab wrap logic identical so overlays share one a11y pattern.
 */

export const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function queryFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  );
}

/** Same Tab wrap as confirm-dialog: cycle first↔last inside `container`. */
export function trapTabKey(event: KeyboardEvent, container: HTMLElement): void {
  if (event.key !== 'Tab') {
    return;
  }

  const focusable = queryFocusable(container);
  if (focusable.length === 0) {
    return;
  }

  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;
  const active = document.activeElement as HTMLElement | null;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

/** Capture the element to restore when a modal closes. */
export function captureFocus(): HTMLElement | null {
  const active = document.activeElement;
  return active instanceof HTMLElement ? active : null;
}

export function restoreFocus(element: HTMLElement | null | undefined): void {
  if (!element) {
    return;
  }
  queueMicrotask(() => {
    if (typeof element.focus === 'function') {
      element.focus();
    }
  });
}
