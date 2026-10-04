/** Tap anywhere on the canvas (or Space / arrow keys on desktop) → `onTap`. */
export function bindInput(canvas: HTMLElement, onTap: () => void): void {
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    onTap();
  });
  window.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') && !e.repeat) {
      e.preventDefault();
      onTap();
    }
  });
}
