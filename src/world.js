/**
 * @file The `World` accessor tree — baseline statistics that everything else
 * is measured against, plus the representatives namespace (the future home
 * of the full USReps dataset, migrating from the campaign app in M3).
 *
 * Places are hierarchical, narrowing left to right, friendly-spelled,
 * case-insensitive; no argument means the whole world:
 *
 *   World.Population()                       -> world population, most recent year
 *   World.Population('us')                   -> US population
 *   World.Population('us', 'texas')          -> Texas population
 *   World.Population('us', 'texas').Year(2023)
 *   World.Population().Cite                  -> the receipts
 *   World.Representatives('us', 'texas').Senators
 *
 * Everything Population returns is a Stat (see core.js): usable directly as
 * its numeric value, with `.Cite` and the year accessors attached.
 */

/** @typedef {import('./types.js').Geo} Geo */
/** @typedef {import('./types.js').MetricFile} MetricFile */
/** @typedef {import('./types.js').Stat} Stat */
/** @typedef {import('./types.js').ScopedStat} ScopedStat */
/** @typedef {import('./types.js').SourceCitation} SourceCitation */

import { METRICS, REPS } from './registry.js'
import { caseless, normalizeGeo, resolvePoint, resolveSource } from './core.js'

/**
 * One chamber of a legislature (seats, and members once M3 lands).
 * @typedef {Object} RepChamber
 * @property {number} seats
 * @property {Array<{ name: string, party: string, chamber?: string, since?: number }>} [members]
 * @property {string} [note]
 */

/**
 * A place entry in representatives.yaml.
 * @typedef {Object} RepPlace
 * @property {string} name
 * @property {RepChamber} senate
 * @property {RepChamber} house
 * @property {RepChamber} [state_senate]
 * @property {RepChamber} [state_house]
 * @property {string[]} sources
 */

/**
 * A resolved representatives node.
 * @typedef {Object} RepsNode
 * @property {string} name
 * @property {RepChamber} Senators
 * @property {RepChamber} House
 * @property {RepChamber} [StateSenate]
 * @property {RepChamber} [StateHouse]
 * @property {SourceCitation[]} Cite
 */

// Geo -> the representatives.yaml place key.
const REP_PLACE_KEYS = { US: 'us', TX: 'us.texas' }

/**
 * Resolve a hierarchical place path to a Geo. Segments narrow left to
 * right ('us', 'texas'); the most specific segment decides. Empty = WORLD.
 * @param {Array<Geo | string>} places
 * @returns {Geo}
 */
function resolvePlace(places) {
  if (places.length === 0) return 'WORLD'
  const geos = places.map(normalizeGeo)
  return geos.at(-1) ?? 'WORLD'
}

/**
 * Build a baseline accessor (Population now; more baseline families later).
 * Calling it resolves the place path to the most recent observation — a
 * Stat with `.Year/.Series/.Files` re-attached, place pinned.
 * @param {string} family  Metric-file id prefix, e.g. 'population'.
 * @returns {(...places: Array<Geo | string>) => ScopedStat}
 */
function makeBaseline(family) {
  /** @param {Geo} geo @returns {MetricFile} */
  const pick = (geo) => {
    const file = METRICS.find((m) => m.id.startsWith(`${family}.`) && m.geo === geo)
    if (file) return file
    const covered = METRICS.filter((m) => m.id.startsWith(`${family}.`))
      .map((m) => m.geo)
      .join(', ')
    throw new Error(`No ${family} dataset for ${geo}. Geographies with data: ${covered}.`)
  }

  /** @param {MetricFile} file @param {number|string} year @returns {Stat} */
  const yearPoint = (file, year) => {
    const y = typeof year === 'string' ? Number.parseInt(year, 10) : year
    if (!Number.isInteger(y)) throw new Error(`Invalid year: ${JSON.stringify(year)}`)
    const point = file.observations.find((p) => p.year === y)
    if (!point) {
      const years = file.observations.map((p) => p.year).sort((a, b) => a - b)
      throw new Error(`No ${y} observation in ${file.id}. Years available: ${years.join(', ')}`)
    }
    return resolvePoint(file, point)
  }

  return (...places) => {
    const geo = resolvePlace(places)
    const file = pick(geo)
    const latest = file.observations.reduce((a, b) => (b.year > a.year ? b : a))
    const stat = resolvePoint(file, latest)
    /**
     * Family accessors re-attached to the latest Stat, pinned to this
     * place's dataset. Typed against ScopedStat's accessor members so the
     * composition below needs no lossy cast (was TS2352).
     * @type {Pick<ScopedStat, 'Year' | 'Month' | 'Day' | 'Series' | 'Files'>}
     */
    const pinned = {
      Year: (year) => yearPoint(file, year),
      Month: () => {
        throw new Error(`${file.id} is an annual baseline; no sub-annual derivation is offered.`)
      },
      Day: () => {
        throw new Error(`${file.id} is an annual baseline; no sub-annual derivation is offered.`)
      },
      Series: (opts = {}) => {
        const { order = 'asc' } = /** @type {{ order?: 'asc' | 'desc' }} */ (opts)
        return file.observations
          .slice()
          .sort((a, b) => (order === 'desc' ? b.year - a.year : a.year - b.year))
          .map((p) => resolvePoint(file, p))
      },
      Files: () => [file]
    }
    return /** @type {ScopedStat} */ (Object.assign(stat, pinned))
  }
}

/**
 * The representatives namespace. Structural baseline today (chambers,
 * seats, the Texas federal senators); the full lawmaker dataset — 184
 * records with stances, districts, and citations — migrates here in M3.
 * @param {...(Geo | string)} places
 * @returns {RepsNode}
 */
function Representatives(...places) {
  const geo = resolvePlace(places)
  const key = REP_PLACE_KEYS[/** @type {keyof typeof REP_PLACE_KEYS} */ (geo)]
  if (!key) {
    throw new Error(
      `No representatives dataset for ${geo}. Pass a country ('us') or a state path ('us', 'texas').`
    )
  }
  const entry = REPS.places[key]
  if (!entry) throw new Error(`representatives.yaml has no '${key}' entry`)
  return /** @type {RepsNode} */ (
    caseless({
      name: entry.name,
      Senators: entry.senate,
      House: entry.house,
      ...(entry.state_senate && { StateSenate: entry.state_senate }),
      ...(entry.state_house && { StateHouse: entry.state_house }),
      Cite: entry.sources.map(resolveSource)
    })
  )
}

/**
 * The World accessor tree: baseline stats + representatives.
 * @type {{
 *   Population: (...places: Array<Geo | string>) => ScopedStat,
 *   Representatives: (...places: Array<Geo | string>) => RepsNode
 * }}
 */
export const World = caseless({
  Population: makeBaseline('population'),
  Representatives
})
