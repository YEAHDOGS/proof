/**
 * @file Bridge between PROOF metric files and the WorldMap component: turns
 * a dataset's latest observation into the component's country array.
 *
 * Metric files carry a single `geo`; the map geometry carries ISO 3166-1
 * alpha-2 country ids (lowercase). Only national geos resolve to a country
 * polygon — TX is subnational and WORLD is an aggregate, and both are
 * honestly unmappable rather than fudged onto a shape.
 */

/** @typedef {import('./types.js').MetricFile} MetricFile */

import { normalizeGeo } from './core.js'

/**
 * A country entry for the WorldMap component.
 * @typedef {Object} MapCountry
 * @property {string} code   Lowercase ISO 3166-1 alpha-2, matches the SVG path id.
 * @property {string} name   Display name for tooltips and the screen-reader list.
 * @property {number} num    Raw value driving the log ramp.
 * @property {string} value  Formatted value for the tooltip.
 */

/** Geo -> country polygon. Extend as datasets gain national geographies. @type {Record<string, { code: string, name: string }>} */
const GEO_COUNTRIES = {
  US: { code: 'us', name: 'United States' }
}

/** Compact display value: 79358 -> 79.4K, 5.5e9 -> 5.5B. */
function defaultFormat(v) {
  const abs = Math.abs(v)
  const trim = (n) => (Math.round(n * 10) / 10).toLocaleString('en-US')
  if (abs >= 1e9) return `${trim(v / 1e9)}B`
  if (abs >= 1e6) return `${trim(v / 1e6)}M`
  if (abs >= 1e3) return `${trim(v / 1e3)}K`
  return v.toLocaleString('en-US')
}

/**
 * Convert a metric file's latest observation into WorldMap countries.
 * Never throws: files with no mappable geography (TX, WORLD, unknown),
 * no observations, or a null file yield an empty array.
 * @param {MetricFile | null | undefined} metricFile
 * @param {Object} [opts]
 * @param {(v: number) => string} [opts.formatValue]  Tooltip formatter; defaults to compact.
 * @returns {MapCountry[]}
 */
export function metricToMapCountries(metricFile, { formatValue = defaultFormat } = {}) {
  if (!metricFile) return []
  if (!Array.isArray(metricFile.observations) || metricFile.observations.length === 0) return []
  let geo
  try {
    geo = normalizeGeo(metricFile.geo)
  } catch {
    return []
  }
  const place = GEO_COUNTRIES[geo]
  if (!place) return []
  const latest = metricFile.observations.reduce((a, b) => (b.year > a.year ? b : a))
  if (typeof latest.val !== 'number' || !Number.isFinite(latest.val)) return []
  return [{ code: place.code, name: place.name, num: latest.val, value: formatValue(latest.val) }]
}
