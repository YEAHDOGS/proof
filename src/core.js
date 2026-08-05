/**
 * @file Shared machinery for the fluent accessor trees (Substances, World):
 * case-insensitive wrapping, geography normalization, and the Stat type that
 * keeps every number glued to its citations.
 */

/** @typedef {import('./types.js').MetricFile} MetricFile */
/** @typedef {import('./types.js').Geo} Geo */
/** @typedef {import('./types.js').ResolvedObservation} ResolvedObservation */
/** @typedef {import('./types.js').Stat} Stat */

import { SOURCES } from './registry.js'

// Friendly geography spellings accepted by every geo/place selector.
/** @type {Record<string, Geo>} */
export const GEO_ALIASES = {
  us: 'US',
  usa: 'US',
  america: 'US',
  tx: 'TX',
  texas: 'TX',
  world: 'WORLD',
  global: 'WORLD',
  earth: 'WORLD'
}

/**
 * @param {Geo | string} selector
 * @returns {Geo}
 */
export function normalizeGeo(selector) {
  const geo = GEO_ALIASES[String(selector).trim().toLowerCase()]
  if (geo) return geo
  const valid = Object.keys(GEO_ALIASES)
    .map((k) => `'${k}'`)
    .join(', ')
  throw new Error(`Unknown geography '${selector}'. Valid: ${valid}.`)
}

/**
 * Wrap an object (or function) so property access is case-insensitive
 * (node.Usage === node.usage === node.USAGE). Calling a wrapped function
 * still works — only `get` is trapped.
 * @template {object} T
 * @param {T} obj
 * @returns {T}
 */
export function caseless(obj) {
  const lowered = new Map(Object.keys(obj).map((k) => [k.toLowerCase(), k]))
  return new Proxy(obj, {
    get(target, prop, receiver) {
      if (typeof prop !== 'string' || prop in target) return Reflect.get(target, prop, receiver)
      const canonical = lowered.get(prop.toLowerCase())
      return canonical ? Reflect.get(target, canonical, receiver) : undefined
    }
  })
}

/**
 * A resolved observation that IS its number: valueOf() yields the value, so
 * a StatNumber compares, divides, and charts like the primitive it wraps —
 * while still carrying every observation field. `.Cite` (or `.cite`) is the
 * resolved citation list: the stat and its receipts are one object.
 */
export class StatNumber extends Number {
  /**
   * @param {number} value
   * @param {ResolvedObservation} fields
   */
  constructor(value, fields) {
    super(value)
    Object.assign(this, fields)
  }
  get Cite() {
    return /** @type {ResolvedObservation} */ (/** @type {unknown} */ (this)).citations
  }
  get cite() {
    return this.Cite
  }
}

/**
 * Resolve one anchor against the source catalog, throwing on a bad anchor.
 * @param {string} anchor
 * @returns {import('./types.js').SourceCitation}
 */
export function resolveSource(anchor) {
  const source = SOURCES[anchor]
  if (!source) throw new Error(`Citation anchor '${anchor}' missing from sources.yaml`)
  return source
}

/**
 * @param {MetricFile} file
 * @param {import('./types.js').DataPoint} point
 * @returns {Stat}
 */
export function resolvePoint(file, point) {
  const citations = point.citations.map((c) => ({ ...c, source: resolveSource(c.src) }))
  const fields = /** @type {ResolvedObservation} */ ({
    year: point.year,
    val: point.val,
    ...(point.pct !== undefined && { pct: point.pct }),
    basis: point.basis ?? 'reported',
    ...(point.period !== undefined && { period: point.period }),
    metricId: file.id,
    title: file.title,
    unit: file.unit,
    substance: file.substance,
    geo: file.geo,
    citations
  })
  return /** @type {Stat} */ (/** @type {unknown} */ (new StatNumber(point.val, fields)))
}
