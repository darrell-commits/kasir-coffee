export function getImageCropTransform(imageX = 50, imageY = 50, imageZoom = 1) {
  const zoom = Math.min(2, Math.max(1, Number(imageZoom) || 1));
  const horizontalOffset = (50 - Number(imageX ?? 50)) * (zoom - 1);
  const verticalOffset = (50 - Number(imageY ?? 50)) * (zoom - 1);

  return `translate(${horizontalOffset}%, ${verticalOffset}%) scale(${zoom})`;
}