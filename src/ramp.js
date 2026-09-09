/**
 * @file Log-ramp step for choropleth shading (the shared DOGS world map's
 * ramp, vendored here so the map component stays dependency-free): maps a
 * positive value onto 1..`steps` on a logarithmic scale between `min` and
 * `max`. Pure — no DOM, no imports.
 */

/**
 * Place `value` on a 1..`steps` logarithmic ramp between `min` and `max`.
 * Anything non-positive, or a degenerate range, lands on step 1 — the
 * caller never has to guard.
 * @param {number} value  The value to place on the ramp.
 * @param {number} min    Smallest positive value in the dataset.
 * @param {number} max    Largest value in the dataset.
 * @param {number} steps  Number of ramp steps (the world map uses 7).
 * @returns {number} Integer step in [1, steps].
 */
export function rampStep(value, min, max, steps) {
  if (!(value > 0) || !(max > min) || min <= 0) return 1
  const t = (Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min))
  return Math.min(steps, Math.max(1, 1 + Math.round(t * (steps - 1))))
}
