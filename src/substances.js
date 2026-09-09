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
 * Metric families are callable too — the geo selector:
 *
 *   Substances.Alcohol.Usage('world')             -> latest observation, as a Stat
 *   Substances.Alcohol.Usage('world').Cite        -> its resolved citations
 *   Substances.Alcohol.Usage('world').Year(2026)  -> a specific year, same geo
 *   Substances.Alcohol.Usage('us') / 1e6          -> Stats behave as numbers
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
/** @typedef {import('./types.js').Stat} Stat */
/** @typedef {import('./types.js').ScopedStat} ScopedStat */

import { METRICS, COMPOUNDS } from './registry.js'
import { caseless, normalizeGeo, resolvePoint, resolveSource, strictInt, toYear } from './core.js'

/**
 * Options accepted by every family accessor.
 * @typedef {Object} QueryOpts
 * @property {Geo | string} [geo] Geography, default 'US'. Friendly aliases
 *                                work here exactly as on the geo selector —
 *                                'us', 'texas', 'world', etc.
 * @property {string} [metric]  Disambiguates when a family has several measures
 *                              for one (substance, geo), e.g. 'past_year_use'.
 */

/**
 * A metric family under a substance (Deaths, Usage, Sales, ERVisits, Health).
 * Also CALLABLE with a geography — `Usage('world')` — which resolves to the
 * most recent observation for that geo (a Stat: usable as the number itself,
 * `.Cite` for sources) with the family accessors re-attached, geo pinned.
 * @typedef {Object} MetricFamilyMethods
 * @property {(year: number|string, opts?: QueryOpts) => Stat} Year
 * @property {(year: number|string, month: number, opts?: QueryOpts) => DerivedPoint} Month
 * @property {(year: number|string, month: number, day: number, opts?: QueryOpts) => DerivedPoint} Day
 * @property {(opts?: QueryOpts & { order?: 'asc'|'desc' }) => Stat[]} Series
 * @property {(opts?: QueryOpts) => MetricFile[]} Files
 *
 * @typedef {MetricFamilyMethods & ((geo?: Geo | string) => ScopedStat)} MetricFamilyNode
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
 *   Cigarettes: SubstanceNode,
 *   Vapes: SubstanceNode,
 *   Pouches: SubstanceNode,
 *   Gum: SubstanceNode,
 *   Patches: SubstanceNode,
 *   Cigars: SubstanceNode,
 *   RollingTobacco: SubstanceNode
 * }} NicotineNode
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
 * @property {NicotineNode} Nicotine
 * @property {NicotineNode} Tobacco      Alias of Nicotine.
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
  {
    name: 'Nicotine',
    canon: 'NICOTINE',
    variants: {
      Cigarettes: 'cigarette',
      Vapes: 'vape',
      Pouches: 'pouch',
      Gum: 'gum',
      Patches: 'patch',
      Cigars: 'cigar',
      RollingTobacco: 'rolling_tobacco'
    },
    selectors: {
      cigarette: 'Cigarettes',
      cigarettes: 'Cigarettes',
      cig: 'Cigarettes',
      cigs: 'Cigarettes',
      vape: 'Vapes',
      vapes: 'Vapes',
      vaping: 'Vapes',
      'e-cig': 'Vapes',
      'e-cigs': 'Vapes',
      ecig: 'Vapes',
      'e-cigarette': 'Vapes',
      'e-cigarettes': 'Vapes',
      pouch: 'Pouches',
      pouches: 'Pouches',
      zyn: 'Pouches',
      gum: 'Gum',
      nicorette: 'Gum',
      nicorettes: 'Gum',
      patch: 'Patches',
      patches: 'Patches',
      cigar: 'Cigars',
      cigars: 'Cigars',
      'rolling tobacco': 'RollingTobacco',
      'rolling-tobacco': 'RollingTobacco',
      rolling_tobacco: 'RollingTobacco',
      'roll-your-own': 'RollingTobacco',
      ryo: 'RollingTobacco'
    },
    defaultVariant: 'Cigarettes'
  },
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
const ROOT_ALIASES = {
  Cannabis: 'Marijuana',
  Weed: 'Marijuana',
  Psychadelics: 'Psychedelics',
  Tobacco: 'Nicotine'
}
const VARIANT_ALIASES = { LSD: 'Acid', Shrooms: 'Mushrooms', Psilocybin: 'Mushrooms' }

const VALID_DELTAS = [8, 9, 10]
// Matches '8', 'd8', 'delta-8', 'delta 8', 'δ9' (lowercased 'Δ9') and friends.
const DELTA_RE = /^(?:d|delta[-\s]?|δ)?(8|9|10)$/

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
    // filter(Boolean): baseline datasets (population) carry no substance.
    const covered = [...new Set(METRICS.map((m) => m.substance).filter(Boolean))].sort().join(', ')
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
  // Geography aliases work here exactly as on the callable geo selector —
  // { geo: 'texas' } and { geo: 'TX' } resolve to the same dataset.
  const resolvedGeo = normalizeGeo(geo)
  const prefix = FAMILY_PREFIXES[/** @type {keyof typeof FAMILY_PREFIXES} */ (familyName)]
  let candidates = METRICS.filter(
    (m) =>
      m.substance === canon &&
      m.geo === resolvedGeo &&
      m.id.startsWith(`${prefix}.`) &&
      (variant ? m.variant === variant : !m.variant)
  )
  if (metric) candidates = candidates.filter((m) => m.metric === metric)
  if (candidates.length > 1) {
    // The standardized dataset answers unqualified queries; the rest stay
    // reachable via { metric }.
    const preferred = candidates.filter((m) => m.default === true)
    if (preferred.length === 1) candidates = preferred
  }
  if (candidates.length === 1) return candidates[0]
  const scope = `${canon}${variant ? ` (${variant})` : ''} ${familyName} in ${resolvedGeo}`
  if (candidates.length === 0) {
    throw new Error(`No ${scope} dataset. ${coverageSummary(canon)}`)
  }
  const ids = candidates.map((m) => `'${m.metric}' (${m.id})`).join(', ')
  throw new Error(`Multiple ${scope} datasets - pass { metric } to choose one of: ${ids}`)
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
 * Point the user at sibling datasets when the resolved file lacks the
 * requested year — the series they want often lives under another metric
 * for the same (substance, family, geo) (e.g. the cross-checked past-month
 * alcohol series next to the default past-year persons dataset).
 * @param {Substance} canon
 * @param {string} familyName
 * @param {Variant | null} variant
 * @param {Geo} geo
 * @param {MetricFile} file  The dataset the query resolved to (excluded).
 * @returns {string} '' when there are no siblings, else a hint sentence.
 */
function siblingHint(canon, familyName, variant, geo, file) {
  const prefix = FAMILY_PREFIXES[/** @type {keyof typeof FAMILY_PREFIXES} */ (familyName)]
  const siblings = METRICS.filter(
    (m) =>
      m !== file &&
      m.substance === canon &&
      m.geo === geo &&
      m.id.startsWith(`${prefix}.`) &&
      (variant ? m.variant === variant : !m.variant)
  )
  if (siblings.length === 0) return ''
  const list = siblings
    .map((m) => {
      const years = m.observations.map((p) => p.year)
      return `${m.id} (${Math.min(...years)}-${Math.max(...years)}, { metric: '${m.metric}' })`
    })
    .join('; ')
  return ` Other ${canon} ${familyName} datasets in ${geo}: ${list}.`
}

/**
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
      const hint = siblingHint(canon, familyName, variant, normalizeGeo(opts?.geo ?? DEFAULT_GEO), file)
      throw new Error(`No ${y} observation in ${file.id}. Years available: ${years.join(', ')}.${hint}`)
    }
    return resolvePoint(file, point)
  }

  /** @type {MetricFamilyNode['Month']} */
  const Month = (year, month, opts) => {
    const y = toYear(year)
    const m = strictInt(month, 'month')
    if (m < 1 || m > 12) {
      throw new Error(`Invalid month: ${month} (expected 1-12)`)
    }
    // TODO: serve real monthly series directly once a dataset publishes one.
    assertDerivable(pickFile(canon, familyName, variant, opts))
    const annual = Year(y, opts)
    return {
      year: y,
      month: m,
      val: annual.val / 12,
      metric: annual.metric,
      unit: annual.unit,
      basis: /** @type {'derived'} */ ('derived'),
      note: `Derived: ${annual.val} ${annual.unit} in ${y} / 12 months (uniform spread; no monthly series published).`,
      from: annual
    }
  }

  /** @type {MetricFamilyNode['Day']} */
  const Day = (year, month, day, opts) => {
    const y = toYear(year)
    const m = strictInt(month, 'month')
    if (m < 1 || m > 12) {
      throw new Error(`Invalid month: ${month} (expected 1-12)`)
    }
    const d = strictInt(day, 'day')
    if (d < 1 || d > daysInMonth(y, m)) {
      throw new Error(`Invalid day: ${y}-${month}-${day}`)
    }
    assertDerivable(pickFile(canon, familyName, variant, opts))
    const annual = Year(y, opts)
    const days = daysInYear(y)
    return {
      year: y,
      month: m,
      day: d,
      val: annual.val / days,
      metric: annual.metric,
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

  /** @type {MetricFamilyMethods['Files']} */
  const Files = ({ geo, metric } = {}) => {
    const prefix = FAMILY_PREFIXES[/** @type {keyof typeof FAMILY_PREFIXES} */ (familyName)]
    const resolvedGeo = geo === undefined ? undefined : normalizeGeo(geo)
    return METRICS.filter(
      (m) =>
        m.substance === canon &&
        m.id.startsWith(`${prefix}.`) &&
        (variant ? m.variant === variant : !m.variant) &&
        (resolvedGeo === undefined || m.geo === resolvedGeo) &&
        (!metric || m.metric === metric)
    )
  }

  /**
   * The geo selector: `Usage('world')` resolves the default dataset for that
   * geography down to its MOST RECENT observation — returned as a Stat (the
   * number itself, `.Cite` attached) with the family accessors re-attached
   * and pinned to the geo, so `.Year(2026)` and `.Series()` chain from it.
   * @param {Geo | string} [geoSelector]
   * @returns {ScopedStat}
   */
  const scope = (geoSelector) => {
    const geo = geoSelector === undefined ? DEFAULT_GEO : normalizeGeo(geoSelector)
    const file = pickFile(canon, familyName, variant, { geo })
    const latest = file.observations.reduce((a, b) => (b.year > a.year ? b : a))
    const stat = resolvePoint(file, latest)
    return /** @type {ScopedStat} */ (
      Object.assign(/** @type {object} */ (stat), {
        Year: (/** @type {number|string} */ y, /** @type {QueryOpts} */ opts = {}) =>
          Year(y, { ...opts, geo }),
        Month: (
          /** @type {number|string} */ y,
          /** @type {number} */ m,
          /** @type {QueryOpts} */ opts = {}
        ) => Month(y, m, { ...opts, geo }),
        Day: (
          /** @type {number|string} */ y,
          /** @type {number} */ m,
          /** @type {number} */ d,
          /** @type {QueryOpts} */ opts = {}
        ) => Day(y, m, d, { ...opts, geo }),
        Series: (/** @type {QueryOpts & { order?: 'asc'|'desc' }} */ opts = {}) =>
          Series({ ...opts, geo }),
        Files: (/** @type {QueryOpts} */ opts = {}) => Files({ ...opts, geo })
      })
    )
  }

  return /** @type {MetricFamilyNode} */ (
    caseless(Object.assign(scope, { Year, Month, Day, Series, Files }))
  )
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
  const citations = info.sources.map(resolveSource)
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
    const num = strictInt(n, 'delta isomer number')
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
