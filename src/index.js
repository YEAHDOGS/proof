/**
 * @file PROOF (@dogs/proof) — public API.
 *
 * Loads every YAML dataset under src/data/ at build time (via
 * @modyfi/vite-plugin-yaml + import.meta.glob) and exposes typed query,
 * sorting, citation, and integrity helpers. No runtime I/O.
 */

/** @typedef {import('./types.js').MetricFile} MetricFile */
/** @typedef {import('./types.js').DataPoint} DataPoint */
/** @typedef {import('./types.js').Citation} Citation */
/** @typedef {import('./types.js').SourceCitation} SourceCitation */
/** @typedef {import('./types.js').Substance} Substance */
/** @typedef {import('./types.js').Geo} Geo */
/** @typedef {import('./types.js').ClaimComparison} ClaimComparison */

import { METRICS, SOURCES } from './registry.js'

export { Substances } from './substances.js'
export { World } from './world.js'
export { metricToMapCountries } from './map.js'
export { deathsPerDay, deathsToday } from './today.js'
export { rampStep } from './ramp.js'

/**
 * Every dataset in the library, unfiltered.
 * @returns {MetricFile[]}
 */
export function getAllMetrics() {
  return METRICS.slice()
}

/**
 * Filter datasets by substance, geography, and/or free-text search.
 * All criteria are optional and AND-ed together.
 * @param {Object} [query]
 * @param {Substance} [query.substance]  Exact substance match.
 * @param {Geo} [query.geo]              Exact geography match.
 * @param {string} [query.search]        Case-insensitive substring match
 *                                       against id, title, metric, and description.
 * @returns {MetricFile[]}
 */
export function queryMetrics({ substance, geo, search } = {}) {
  const needle = search ? search.toLowerCase() : null
  return METRICS.filter((m) => {
    if (substance && m.substance !== substance) return false
    if (geo && m.geo !== geo) return false
    if (needle) {
      const haystack = `${m.id} ${m.title} ${m.metric} ${m.description ?? ''}`.toLowerCase()
      if (!haystack.includes(needle)) return false
    }
    return true
  })
}

/**
 * Look up a single dataset by its stable id.
 * @param {string} metricId  e.g. 'usage.cannabis.us.past_year'
 * @returns {MetricFile | undefined}
 */
export function getMetric(metricId) {
  return METRICS.find((m) => m.id === metricId)
}

/**
 * Observations of a dataset sorted by year, ready for plotting.
 * Returns a copy; never mutates the dataset.
 * @param {string} metricId
 * @param {'asc' | 'desc'} [order]
 * @returns {DataPoint[]}
 * @throws {Error} when the metric id is unknown.
 */
export function getSortedPoints(metricId, order = 'asc') {
  const metric = getMetric(metricId)
  if (!metric) throw new Error(`Unknown metric id: ${metricId}`)
  const points = metric.observations.slice()
  points.sort((a, b) => (order === 'desc' ? b.year - a.year : a.year - b.year))
  return points
}

/**
 * The full citation catalog (anchor -> source details).
 * @returns {Record<string, SourceCitation>}
 */
export function getAllSources() {
  return { ...SOURCES }
}

/**
 * Resolve a single source anchor.
 * @param {string} anchor
 * @returns {SourceCitation | undefined}
 */
export function getSource(anchor) {
  return SOURCES[anchor]
}

/**
 * All citations for one observation, with each anchor resolved against the
 * source catalog — the "show me exactly where this number comes from" call.
 * @param {string} metricId
 * @param {number} year
 * @returns {Array<Citation & { source: SourceCitation }>}
 * @throws {Error} when the metric id or year is unknown.
 */
export function getCitations(metricId, year) {
  const point = findPoint(metricId, year)
  return point.citations.map((c) => {
    const source = SOURCES[c.src]
    if (!source) throw new Error(`Citation anchor '${c.src}' missing from sources.yaml`)
    return { ...c, source }
  })
}

/**
 * Compare every value the sources claim for one observation — the
 * grounded-news view: does the number survive being checked, and how far
 * apart are the publications that report it?
 * @param {string} metricId
 * @param {number} year
 * @returns {ClaimComparison}
 * @throws {Error} when the metric id or year is unknown.
 */
export function compareClaims(metricId, year) {
  const point = findPoint(metricId, year)
  const claimed = point.citations
    .map((c) => c.val)
    .filter(/** @returns {v is number} */ (v) => typeof v === 'number')
  const min = claimed.length ? Math.min(...claimed) : point.val
  const max = claimed.length ? Math.max(...claimed) : point.val
  return {
    year: point.year,
    consensus: point.val,
    claimed,
    min,
    max,
    spread: Number((max - min).toFixed(10)),
    corroborated: claimed.length >= 2
  }
}

/**
 * Audit one dataset against the citation policy. Returns a list of problems;
 * an empty array means the dataset is sound. Checked rules:
 *  - every observation has at least one citation (the array is the single
 *    record of sourcing; its first entry is the primary source),
 *  - every citation anchor resolves in sources.yaml,
 *  - every citation carries a direct https URL to its evidence,
 *  - at least one citation restates the observation's value.
 * @param {MetricFile} metric
 * @returns {string[]}
 */
export function validateDataset(metric) {
  /** @type {string[]} */
  const problems = []
  for (const point of metric.observations) {
    const where = `${metric.id} @ ${point.year}`
    if (!point.citations || point.citations.length === 0) {
      problems.push(`${where}: no citations`)
      continue
    }
    for (const c of point.citations) {
      if (!SOURCES[c.src]) {
        problems.push(`${where}: citation anchor '${c.src}' not in sources.yaml`)
      }
      if (!c.url || !/^https:\/\//.test(c.url)) {
        problems.push(`${where}: citation '${c.src}' has no direct https url`)
      }
    }
    if (!point.citations.some((c) => typeof c.val === 'number')) {
      problems.push(`${where}: no citation restates the value`)
    }
  }
  return problems
}

/**
 * @param {string} metricId
 * @param {number} year
 * @returns {DataPoint}
 */
function findPoint(metricId, year) {
  const metric = getMetric(metricId)
  if (!metric) throw new Error(`Unknown metric id: ${metricId}`)
  const point = metric.observations.find((p) => p.year === year)
  if (!point) throw new Error(`No ${year} observation in ${metricId}`)
  return point
}
