// Curseur personnalisé de Golgotha (components/customCursor) : il réagit aux éléments
// `[data-cursor]` via mouseover / mouseout. Les tuiles WebGL ne sont pas des éléments DOM :
// le canvas reçoit l'attribut le temps du survol d'une tuile, avec les événements attendus.
export function setCursorHover(canvas: HTMLCanvasElement, hover: boolean) {
  if (hover === canvas.hasAttribute('data-cursor')) return;
  if (hover) {
    canvas.setAttribute('data-cursor', 'hover');
    canvas.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  } else {
    canvas.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    canvas.removeAttribute('data-cursor');
  }
}
