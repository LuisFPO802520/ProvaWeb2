export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function clamp01(value) {
  return clamp(value, 0, 1);
}

export function lerp(a, b, alpha) {
  return a + (b - a) * alpha;
}

export function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function normalizeVector(x, y) {
  const len = Math.hypot(x, y);
  if (len === 0) return { x: 0, y: 0, len: 0 };
  return { x: x / len, y: y / len, len };
}