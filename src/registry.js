/**
 * @file Central data registry — the single place YAML datasets are loaded.
 *
 * Everything here is resolved at build time (@modyfi/vite-plugin-yaml +
 * import.meta.glob); the published library performs no runtime I/O.
 */

/** @typedef {import('./types.js').MetricFile} MetricFile */
/** @typedef {import('./types.js').SourceCitation} SourceCitation */
/** @typedef {import('./types.js').CompoundInfo} CompoundInfo */

import sourcesYaml from './data/sources.yaml'
import compoundsYaml from './data/compounds.yaml'
import representativesYaml from './data/representatives.yaml'

/** @type {Record<string, SourceCitation>} */
export const SOURCES = /** @type {Record<string, SourceCitation>} */ (sourcesYaml)

// Metric files live one directory below data/ (usage/, safety/, ...);
// sources.yaml and compounds.yaml sit at the data/ root and are
// intentionally not matched here.
const metricModules = import.meta.glob('./data/*/*.yaml', {
  eager: true,
  import: 'default'
})

/** @type {MetricFile[]} */
export const METRICS = /** @type {MetricFile[]} */ (Object.values(metricModules))

/**
 * Compound reference sheets keyed by substance, then compound key
 * (e.g. COMPOUNDS.substances.marijuana['delta-8']).
 * @type {{ meta: { verification: string, note?: string }, substances: Record<string, Record<string, CompoundInfo>> }}
 */
export const COMPOUNDS =
  /** @type {{ meta: { verification: string, note?: string }, substances: Record<string, Record<string, CompoundInfo>> }} */ (
    compoundsYaml
  )

/**
 * Representative/legislature baseline, keyed by place path ('us',
 * 'us.texas'). Structural seats data now; full lawmaker records migrate
 * from the campaign app in M3.
 * @type {{ meta: { verification: string, note?: string }, places: Record<string, import('./world.js').RepPlace> }}
 */
export const REPS =
  /** @type {{ meta: { verification: string, note?: string }, places: Record<string, import('./world.js').RepPlace> }} */ (
    representativesYaml
  )
