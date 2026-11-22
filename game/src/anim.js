// Emberfall — tiny motion helpers: floating damage numbers, screen shake,
// and the easing used to slide cards into place. No library, just numbers.
export function createFx() {
  return { floaters: [], shake: 0 };
}

export function spawnFloater(fx, x, y, text, color) {
  fx.floaters.push({ x, y, text, color, born: performance.now(), life: 900 });
}

export function addShake(fx, amount) {
  fx.shake = Math.min(10, fx.shake + amount);
}

export function tickFx(fx, now) {
  fx.floaters = fx.floaters.filter((f) => now - f.born < f.life);
  fx.shake *= 0.88;
  if (fx.shake < 0.2) fx.shake = 0;
}

export function easeOut(t) {
  const x = Math.max(0, Math.min(1, t));
  return 1 - (1 - x) * (1 - x);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Slide a display position toward its target; returns true once it arrives.
export function slideTo(obj, tx, ty, rate) {
  obj.dx = lerp(obj.dx ?? tx, tx, rate);
  obj.dy = lerp(obj.dy ?? ty, ty, rate);
  return Math.abs(obj.dx - tx) < 0.6 && Math.abs(obj.dy - ty) < 0.6;
}
