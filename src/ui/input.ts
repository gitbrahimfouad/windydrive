/**
 * Tap anywhere on the canvas (or Space / arrow keys on desktop) → `onTap`.
 * While `isBlocked()` is true (e.g. a dialog is open) keys are left to the page (Space activates the focused button).
 */
export function bindInput(canvas: HTMLElement, onTap: () => void, isBlocked: () => boolean = () => false): void {
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    onTap();
  });
  window.addEventListener('keydown', (e) => {
    if (isBlocked()) return;
    if ((e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') && !e.repeat) {
      e.preventDefault();
      onTap();
    }
  });
}
