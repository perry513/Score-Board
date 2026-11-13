/** True when `el` sits inside the overlay that is currently on top (so only it handles keys). */
export function isTopOverlay(el) {
  const overlays = document.querySelectorAll('.overlay');
  return !!el && overlays.length > 0 && overlays[overlays.length - 1].contains(el);
}
