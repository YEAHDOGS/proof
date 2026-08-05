/**
 * @file The fluent `Substances` accessor tree.
 *
 * Every substance node is BOTH an object and a function, and every one of
 * them accepts the same standard selector grammar (see docs/substances.md):
 *
 *   Substances.Cocaine()                    -> default sub-form (Powder)
 *   Substances.Cocaine('p' | 'powder')      -> Powder node
 *   Substances.Cocaine('c' | 'crack')       -> Crack node
 *   Substances.Marijuana('thc' | 'cbd')     -> compound sheet entry
 *   Substances.Marijuana('delta-8'|'8'|8)   -> delta isomer compound
 *   Substances.Marijuana('all')             -> every compound   (derived)
 *   Substances.Marijuana('banned')          -> banned compounds (derived, Texas flags)
 *   Substances.Heroin()                     -> itself (no sub-forms)
 *
 * Property access stays available and case-insensitive at every level
 * (Substances.marijuana.usage.year(2023) works), and every leaf returns the
 * value WITH its citations resolved — numbers never travel without their
 * receipts. Sub-annual values are honest derivations: count units divide
 * across months/days (flagged basis 'derived' with the formula in `note`);
 * percent prevalences refuse to divide.
 */

/** @typedef {import('./types.js').MetricFile} MetricFile */
/** @typedef {import('./types.js').Substance} Substance */
/** @typedef {import('./types.js').Variant} Variant */
/** @typedef {import('./types.js').Geo} Geo */
/** @typedef {import('./types.js').ResolvedObservation} ResolvedObservation */
/** @typedef {import('./types.js').ResolvedCitation} ResolvedCitation */
/** @typedef {import('./types.js').DerivedPoint} DerivedPoint */
/** @typedef {import('./types.js').ResolvedCompound} ResolvedCompound */

import { METRICS, SOURCES, COMPOUNDS } from './registry.js'

/**
 * Options accepted by every family accessor.
 * @typedef {Object} QueryOpts
 * @property {Geo} [geo]        Geography, default 'US'.
 * @property {string} [metric]  Disambiguates when a family has several measures
 *                              for one (substance, geo), e.g. 'past_year_use'.
 */

/**
 * A metric family under a substance (Deaths, Usage, Sales, ERVisits, Health).
 * @typedef {Object} MetricFamilyNode
 * @property {(year: number|string, opts?: QueryOpts) => ResolvedObservation} Year
 * @property {(year: number|string, month: number, opts?: QueryOpts) => DerivedPoint} Month
 * @property {(year: number|string, month: number, day: number, opts?: QueryOpts) => DerivedPoint} Day
 * @property {(opts?: QueryOpts & { order?: 'asc'|'desc' }) => ResolvedObservation[]} Series
 * @property {(opts?: QueryOpts) => MetricFile[]} Files
 */

/**
 * The family set every substance (and variant sub-form) exposes.
 * @typedef {Object} SubstanceNode
 * @property {MetricFamilyNode} Deaths
 * @property {MetricFamilyNode} Usage
 * @property {MetricFamilyNode} Sales
 * @property {MetricFamilyNode} ERVisits
 * @property {MetricFamilyNode} Health
 */

/**
 * What a standard selector call can return: a sub-form node, a compound,
 * or (for 'all'/'banned') an array of either.
 * @typedef {SubstanceNode | ResolvedCompound | Array<SubstanceNode | ResolvedCompound>} SelectorResult
 */

/**
 * A substance node: the family set, callable with the standard selector.
 * @typedef {SubstanceNode & ((selector?: string|number) => SelectorResult)} CallableSubstanceNode
 */

/**
 * @typedef {CallableSubstanceNode & {
 *   thc: ResolvedCompound,
 *   cbd: ResolvedCompound,
 *   thca: ResolvedCompound,
 *   thcp: ResolvedCompound,
 *   delta: (n: number|string) => ResolvedCompound
 * }} MarijuanaNode
 */

/**
 * @typedef {CallableSubstanceNode & { Crack: SubstanceNode, Powder: SubstanceNode }} CocaineNode
 */

/**
 * @typedef {CallableSubstanceNode & {
 *   Mushrooms: SubstanceNode,
 *   Acid: SubstanceNode,
 *   DMT: SubstanceNode,
 *   Salvia: SubstanceNode
 * }} PsychedelicsNode
 */

/**
 * @typedef {Object} SubstancesIndex
 * @property {MarijuanaNode} Marijuana
 * @property {MarijuanaNode} Cannabis      Alias of Marijuana.
 * @property {CocaineNode} Cocaine
 * @property {CallableSubstanceNode} Heroin
 * @property {CallableSubstanceNode} Alcohol
 * @property {CallableSubstanceNode} Fentanyl
 * @property {CallableSubstanceNode} Opioids
 * @property {CallableSubstanceNode} Amphetamines
 * @property {PsychedelicsNode} Psychedelics
 * @property {PsychedelicsNode} Psychadelics  Common-misspelling alias.
 */

const DEFAULT_GEO = /** @type {Geo} */ ('US')

// Family name -> the first dotted segment of matching metric-file ids.
const FAMILY_PREFIXES = {
  Deaths: 'deaths',
  Usage: 'usage',
  Sales: 'sales',
  ERVisits: 'er_visits',
  Health: 'health'
}

/**
 * Friendly substance name -> canonical Substance code, plus what its
 * standard selector can resolve: variant sub-forms (with their selector
 * spellings) and/or a compound sheet key into compounds.yaml.
 * @type {Array<{
 *   name: string,
 *   canon: Substance,
 *   variants?: Record<string, Variant>,
 *   selectors?: Record<string, string>,
 *   defaultVariant?: string,
 *   compounds?: string
 * }>}
 */
const SUBSTANCE_DEFS = [
  { name: 'Marijuana', canon: 'CANNABIS', compounds: 'marijuana' },
  {
    name: 'Cocaine',
    canon: 'COCAINE',
    variants: { Crack: 'crack', Powder: 'powder' },
    selectors: { powder: 'Powder', p: 'Powder', crack: 'Crack', c: 'Crack' },
    defaultVariant: 'Powder'
  },
  { name: 'Heroin', canon: 'HEROIN' },
  { name: 'Alcohol', canon: 'ALCOHOL' },
  { name: 'Fentanyl', canon: 'FENTANYL' },
  { name: 'Opioids', canon: 'OPIOIDS' },
  { name: 'Amphetamines', canon: 'AMPHETAMINES' },
  {
    name: 'Psychedelics',
    canon: 'PSYCHEDELICS',
    variants: { Mushrooms: 'mushrooms', Acid: 'lsd', DMT: 'dmt', Salvia: 'salvia' },
    selectors: {
      mushrooms: 'Mushrooms',
      shrooms: 'Mushrooms',
      psilocybin: 'Mushrooms',
      acid: 'Acid',
      lsd: 'Acid',
      dmt: 'DMT',
      salvia: 'Salvia'
    }
  }
]

// Extra names resolving to the same nodes.
const ROOT_ALIASES = { Cannabis: 'Marijuana', Weed: 'Marijuana', Psychadelics: 'Psychedelics' }
const VARIANT_ALIASES = { LSD: 'Acid', Shrooms: 'Mushrooms', Psilocybin: 'Mushrooms' }

const VALID_DELTAS = [8, 9, 10]
// Matches '8', 'd8', 'delta-8', 'delta 8', 'δ9' (lowercased 'Δ9') and friends.
const DELTA_RE = /^(?:d|delta[-\s]?|δ)?(8|9|10)$/

/**
 * Wrap an object (or function) so property access is case-insensitive
 * (node.Usage === node.usage === node.USAGE). Calling a wrapped function
 * still works — only `get` is trapped.
 * @template {object} T
 * @param {T} obj
 * @returns {T}
 */
function caseless(obj) {
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
 * @param {number|string} year
 * @returns {number}
 */
function toYear(year) {
  const y = typeof year === 'string' ? Number.parseInt(year, 10) : year
  if (!Number.isInteger(y)) throw new Error(`Invalid year: ${JSON.stringify(year)}`)
  return y
}

/** @param {number} year */
function daysInYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365
}

/** @param {number} year @param {number} month */
function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/**
 * One-line human summary of what data exists for a substance, used to make
 * "no data yet" errors actionable instead of dead ends.
 * @param {Substance} canon
 * @returns {string}
 */
function coverageSummary(canon) {
  const files = METRICS.filter((m) => m.substance === canon)
  if (files.length === 0) {
    const covered = [...new Set(METRICS.map((m) => m.substance))].sort().join(', ')
    return `No datasets for ${canon} yet. Substances with data: ${covered}.`
  }
  const lines = files.map((m) => {
    const years = m.observations.map((p) => p.year)
    return `${m.id} (${Math.min(...years)}-${Math.max(...years)})`
  })
  return `Available ${canon} datasets: ${lines.join(', ')}.`
}

/**
 * Find the single metric file for (substance, family, geo, variant),
 * throwing a descriptive error on zero or ambiguous matches.
 * @param {Substance} canon
 * @param {string} familyName
 * @param {Variant | null} variant
 * @param {QueryOpts} [opts]
 * @returns {MetricFile}
 */
function pickFile(canon, familyName, variant, { geo = DEFAULT_GEO, metric } = {}) {
  const prefix = FAMILY_PREFIXES[/** @type {keyof typeof FAMILY_PREFIXES} */ (familyName)]
  let candidates = METRICS.filter(
    (m) =>
      m.substance === canon &&
      m.geo === geo &&
      m.id.startsWith(`${prefix}.`) &&
      (variant ? m.variant === variant : !m.variant)
  )
  if (metric) candidates = candidates.filter((m) => m.metric === metric)
  if (candidates.length === 1) return candidates[0]
  const scope = `${canon}${variant ? ` (${variant})` : ''} ${familyName} in ${geo}`
  if (candidates.length === 0) {
    throw new Error(`No ${scope} dataset. ${coverageSummary(canon)}`)
  }
  const ids = candidates.map((m) => `'${m.metric}' (${m.id})`).join(', ')
  throw new Error(`Multiple ${scope} datasets - pass { metric } to choose one of: ${ids}`)
}

/**
 * @param {MetricFile} file
 * @param {import('./types.js').DataPoint} point
 * @returns {ResolvedObservation}
 */
function resolvePoint(file, point) {
  const citations = point.citations.map((c) => {
    const source = SOURCES[c.src]
    if (!source) throw new Error(`Citation anchor '${c.src}' missing from sources.yaml`)
    return { ...c, source }
  })
  return {
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
  }
}

/**
 * Guard: sub-annual derivation only makes sense for count-like units.
 * A prevalence percentage ("21.8% used in the past year") cannot be
 * divided into months — refusing loudly beats deriving nonsense.
 * @param {MetricFile} file
 */
function assertDerivable(file) {
  if (!file.unit.startsWith('percent')) return
  throw new Error(
    `${file.id} is a percent measure (${file.unit}) - a prevalence cannot be divided ` +
      `into months or days. Sub-annual derivation is only offered for count units ` +
      `(deaths, visits, dollars).`
  )
}

/**
 * Build one metric-family accessor (Deaths, Usage, ...) for a substance/variant.
 * @param {Substance} canon
 * @param {string} familyName
 * @param {Variant | null} variant
 * @returns {MetricFamilyNode}
 */
function makeFamily(canon, familyName, variant) {
  /** @type {MetricFamilyNode['Year']} */
  const Year = (year, opts) => {
    const y = toYear(year)
    const file = pickFile(canon, familyName, variant, opts)
    const point = file.observations.find((p) => p.year === y)
    if (!point) {
      const years = file.observations.map((p) => p.year).sort((a, b) => a - b)
      throw new Error(`No ${y} observation in ${file.id}. Years available: ${years.join(', ')}`)
    }
    return resolvePoint(file, point)
  }

  /** @type {MetricFamilyNode['Month']} */
  const Month = (year, month, opts) => {
    const y = toYear(year)
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error(`Invalid month: ${month} (expected 1-12)`)
    }
    // TODO: serve real monthly series directly once a dataset publishes one.
    assertDerivable(pickFile(canon, familyName, variant, opts))
    const annual = Year(y, opts)
    return {
      year: y,
      month,
      val: annual.val / 12,
      unit: annual.unit,
      basis: /** @type {'derived'} */ ('derived'),
      note: `Derived: ${annual.val} ${annual.unit} in ${y} / 12 months (uniform spread; no monthly series published).`,
      from: annual
    }
  }

  /** @type {MetricFamilyNode['Day']} */
  const Day = (year, month, day, opts) => {
    const y = toYear(year)
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error(`Invalid month: ${month} (expected 1-12)`)
    }
    if (!Number.isInteger(day) || day < 1 || day > daysInMonth(y, month)) {
      throw new Error(`Invalid day: ${y}-${month}-${day}`)
    }
    assertDerivable(pickFile(canon, familyName, variant, opts))
    const annual = Year(y, opts)
    const days = daysInYear(y)
    return {
      year: y,
      month,
      day,
      val: annual.val / days,
      unit: annual.unit,
      basis: /** @type {'derived'} */ ('derived'),
      note: `Derived: ${annual.val} ${annual.unit} in ${y} / ${days} days (uniform spread; no daily series published).`,
      from: annual
    }
  }

  /** @type {MetricFamilyNode['Series']} */
  const Series = (opts = {}) => {
    const { order = 'asc', ...query } = opts
    const file = pickFile(canon, familyName, variant, query)
    const points = file.observations
      .slice()
      .sort((a, b) => (order === 'desc' ? b.year - a.year : a.year - b.year))
    return points.map((p) => resolvePoint(file, p))
  }

  /** @type {MetricFamilyNode['Files']} */
  const Files = ({ geo, metric } = {}) => {
    const prefix = FAMILY_PREFIXES[/** @type {keyof typeof FAMILY_PREFIXES} */ (familyName)]
    return METRICS.filter(
      (m) =>
        m.substance === canon &&
        m.id.startsWith(`${prefix}.`) &&
        (variant ? m.variant === variant : !m.variant) &&
        (!geo || m.geo === geo) &&
        (!metric || m.metric === metric)
    )
  }

  return caseless({ Year, Month, Day, Series, Files })
}

/**
 * @param {Substance} canon
 * @param {Variant | null} [variant]
 * @returns {SubstanceNode}
 */
function makeFamilySet(canon, variant = null) {
  /** @type {Record<string, MetricFamilyNode>} */
  const families = {}
  for (const familyName of Object.keys(FAMILY_PREFIXES)) {
    families[familyName] = makeFamily(canon, familyName, variant)
  }
  return /** @type {SubstanceNode} */ (caseless(families))
}

/**
 * @param {string} substanceKey  Key into COMPOUNDS.substances (e.g. 'marijuana').
 * @param {string} compoundKey   e.g. 'thc', 'delta-8'.
 * @returns {ResolvedCompound}
 */
function resolveCompound(substanceKey, compoundKey) {
  const sheet = COMPOUNDS.substances[substanceKey]
  const info = sheet?.[compoundKey]
  if (!info) {
    const known = sheet ? Object.keys(sheet).join(', ') : '(none)'
    throw new Error(`Unknown ${substanceKey} compound '${compoundKey}'. Known: ${known}`)
  }
  const citations = info.sources.map((anchor) => {
    const source = SOURCES[anchor]
    if (!source) throw new Error(`Compound source anchor '${anchor}' missing from sources.yaml`)
    return source
  })
  return { key: compoundKey, ...info, citations }
}

/**
 * Build one substance node: family set + sub-forms + the standard selector.
 * @param {(typeof SUBSTANCE_DEFS)[number]} def
 * @returns {CallableSubstanceNode}
 */
function makeSubstance(def) {
  const sheet = def.compounds ? COMPOUNDS.substances[def.compounds] : null

  // Sub-forms the selector can resolve: variant family sets and/or compounds.
  /** @type {Record<string, SubstanceNode | ResolvedCompound>} */
  const subforms = {}
  for (const [variantName, variant] of Object.entries(def.variants ?? {})) {
    subforms[variantName] = makeFamilySet(def.canon, variant)
  }
  if (sheet && def.compounds) {
    for (const key of Object.keys(sheet)) subforms[key] = resolveCompound(def.compounds, key)
  }

  // lowercase selector spelling -> subform key
  /** @type {Record<string, string>} */
  const selectorMap = { ...(def.selectors ?? {}) }
  if (sheet) for (const key of Object.keys(sheet)) selectorMap[key] = key

  const deltaCompound = (/** @type {number|string} */ n) => {
    const num = typeof n === 'string' ? Number.parseInt(n, 10) : n
    if (!def.compounds || !VALID_DELTAS.includes(num)) {
      throw new Error(`Unknown delta isomer: delta-${n}. Known: ${VALID_DELTAS.join(', ')}`)
    }
    return resolveCompound(def.compounds, `delta-${num}`)
  }

  const validSelectors = () => {
    const names = [...new Set(Object.keys(selectorMap))].map((s) => `'${s}'`)
    const extras = ["'all'", "'banned'", ...(sheet ? ["'delta-8|9|10'", '8|9|10'] : [])]
    return [...names, ...extras].join(', ') || "'all', 'banned'"
  }

  /** @type {CallableSubstanceNode} */
  let node

  /** @param {string|number} [selector] @returns {SelectorResult} */
  const select = (selector) => {
    if (selector === undefined || selector === null || selector === '') {
      return def.defaultVariant
        ? /** @type {SubstanceNode} */ (subforms[def.defaultVariant])
        : node
    }
    if (typeof selector === 'number') {
      if (!sheet) throw new Error(`Unknown ${def.name} selector '${selector}'. Valid: ${validSelectors()}.`)
      return deltaCompound(selector)
    }
    const s = String(selector).trim().toLowerCase()
    if (s === 'all') return Object.values(subforms)
    if (s === 'banned') {
      return Object.values(subforms).filter(
        (sub) => /** @type {ResolvedCompound} */ (sub).banned?.texas === true
      )
    }
    if (sheet) {
      const m = s.match(DELTA_RE)
      if (m) return deltaCompound(Number(m[1]))
    }
    const key = selectorMap[s]
    if (key) return subforms[key]
    throw new Error(`Unknown ${def.name} selector '${selector}'. Valid: ${validSelectors()}.`)
  }

  Object.assign(select, makeFamilySet(def.canon))
  for (const [name, sub] of Object.entries(subforms)) {
    /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (select))[name] = sub
  }
  if (sheet) /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (select)).delta = deltaCompound
  for (const [alias, target] of Object.entries(VARIANT_ALIASES)) {
    const fn = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (select))
    if (fn[target]) fn[alias] = fn[target]
  }

  node = /** @type {CallableSubstanceNode} */ (/** @type {unknown} */ (caseless(select)))
  return node
}

function buildRoot() {
  /** @type {Record<string, CallableSubstanceNode>} */
  const root = {}
  for (const def of SUBSTANCE_DEFS) root[def.name] = makeSubstance(def)
  for (const [alias, target] of Object.entries(ROOT_ALIASES)) root[alias] = root[target]
  return caseless(root)
}

/**
 * The fluent, case-insensitive, callable substance accessor tree.
 * See docs/substances.md for the full selector grammar.
 * @type {SubstancesIndex}
 */
export const Substances = /** @type {SubstancesIndex} */ (/** @type {unknown} */ (buildRoot()))
