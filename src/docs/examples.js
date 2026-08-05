/**
 * @file The documentation site's example catalog.
 *
 * Every example is a REAL call against the library (`run` executes the same
 * expression the `code` string shows), so the docs can never drift from the
 * actual behavior — including the examples that intentionally throw.
 */

import {
  Substances,
  World,
  queryMetrics,
  getMetric,
  getCitations,
  compareClaims,
  validateDataset,
  getAllSources,
  getSource
} from '../index.js'

/**
 * @typedef {Object} DocExample
 * @property {string} title
 * @property {string} [note]     One-liner under the title.
 * @property {string} code       The snippet shown to the reader.
 * @property {() => unknown} run Executes the snippet for the live result panel.
 * @property {boolean} [throws]  Marks examples whose value IS the error message.
 */

/**
 * @typedef {Object} DocSection
 * @property {string} id
 * @property {string} heading
 * @property {string} blurb
 * @property {DocExample[]} examples
 */

/** @type {DocSection[]} */
export const SECTIONS = [
  {
    id: 'quickstart',
    heading: 'Quick start',
    blurb:
      'One import gives you the fluent Substances tree. Every leaf returns the observation with its citations resolved — a number never travels without its receipts.',
    examples: [
      {
        title: 'A number, with receipts',
        note: 'Past-year cannabis use, US, ages 12+ (NSDUH).',
        code: "import { Substances } from '@dogs/proof'\n\nSubstances.Marijuana.Usage.Year(2023)",
        run: () => Substances.Marijuana.Usage.Year(2023)
      },
      {
        title: 'Texas via the geo option',
        note: 'State NSDUH figures are 2-year averages — the true period rides along.',
        code: "Substances.Marijuana.Usage.Year(2023, { geo: 'TX' })",
        run: () => Substances.Marijuana.Usage.Year(2023, { geo: 'TX' })
      },
      {
        title: 'Case-insensitive at every level',
        note: 'String years work too.',
        code: "Substances.marijuana.usage.year('2023').val",
        run: () => Substances.marijuana.usage.year('2023').val
      },
      {
        title: 'A real, cited zero',
        note: 'Cannabis overdose deaths vs fentanyl, same year, same API.',
        code: '[\n  Substances.Marijuana.Deaths.Year(2023).val,\n  Substances.Fentanyl.Deaths.Year(2023).val\n]',
        run: () => [
          Substances.Marijuana.Deaths.Year(2023).val,
          Substances.Fentanyl.Deaths.Year(2023).val
        ]
      }
    ]
  },
  {
    id: 'world',
    heading: 'World — baseline stats',
    blurb:
      'The World tree holds the baselines everything else is measured against. Places are hierarchical, narrowing left to right; no argument means the whole world; the most recent year answers by default and any year stays selectable.',
    examples: [
      {
        title: 'World population, most recent year',
        code: 'World.Population()',
        run: () => World.Population()
      },
      {
        title: 'Narrow by place path',
        code: "World.Population('us', 'texas')",
        run: () => World.Population('us', 'texas')
      },
      {
        title: 'Any year stays selectable',
        code: "World.Population('us', 'texas').Year(2023)",
        run: () => World.Population('us', 'texas').Year(2023)
      },
      {
        title: 'Baselines make shares honest',
        note: 'Cross-namespace arithmetic: past-year drinkers over US population.',
        code: "((Substances.Alcohol.Usage('us') / World.Population('us')) * 100).toFixed(1) + '%'",
        run: () => ((Substances.Alcohol.Usage('us') / World.Population('us')) * 100).toFixed(1) + '%'
      },
      {
        title: 'Representatives (structural baseline; full records land in M3)',
        code: "World.Representatives('us', 'texas').Senators",
        run: () => World.Representatives('us', 'texas').Senators
      }
    ]
  },
  {
    id: 'geo',
    heading: 'Geography & the latest year',
    blurb:
      "Metric families are callable with a geography — 'world', 'us', 'texas', any case. The call resolves the default dataset for that geo down to its most recent observation, returned as a Stat: an object that IS its numeric value, still carrying its receipts.",
    examples: [
      {
        title: 'Resolve a geography, get the latest',
        note: 'No year given — the most recent observation answers.',
        code: "Substances.Alcohol.Usage('world')",
        run: () => Substances.Alcohol.Usage('world')
      },
      {
        title: 'A specific year, geo pinned',
        code: "Substances.Alcohol.Usage('us').Year(2026)",
        run: () => Substances.Alcohol.Usage('us').Year(2026)
      },
      {
        title: 'Stats behave as numbers',
        note: 'valueOf() yields the value, so arithmetic and comparisons just work.',
        code: "(Substances.Alcohol.Usage('world') / Substances.Alcohol.Usage('us')).toFixed(1)",
        run: () => (Substances.Alcohol.Usage('world') / Substances.Alcohol.Usage('us')).toFixed(1)
      },
      {
        title: '.Cite — the receipts',
        note: 'On the scoped node or on any Year() result.',
        code: "Substances.Alcohol.Usage('world').Cite",
        run: () => Substances.Alcohol.Usage('world').Cite
      },
      {
        title: 'Unknown geographies teach the grammar',
        code: "Substances.Alcohol.Usage('mars')",
        run: () => Substances.Alcohol.Usage('mars'),
        throws: true
      }
    ]
  },
  {
    id: 'selectors',
    heading: 'The standard selector',
    blurb:
      'Every substance node is also callable, with one grammar across the tree: default sub-forms, named variants with shorthands, compound sheets, and derived lists. Unknown selectors throw the list of valid ones.',
    examples: [
      {
        title: 'Sub-forms and shorthands',
        code: "Substances.Cocaine('p') === Substances.Cocaine.Powder",
        run: () => Substances.Cocaine('p') === Substances.Cocaine.Powder
      },
      {
        title: 'Compound sheets',
        note: 'Chemistry, legality, and banned flags — with citations.',
        code: "Substances.Marijuana('delta-8')",
        run: () => Substances.Marijuana('delta-8')
      },
      {
        title: "Derived lists: 'banned'",
        note: 'Compounds flagged banned from Texas consumable retail (Aug 2026 snapshot).',
        code: "Substances.Marijuana('banned').map((c) => c.key)",
        run: () => Substances.Marijuana('banned').map((c) => c.key)
      },
      {
        title: 'Delta isomers, any spelling',
        code: "Substances.Marijuana.delta(9).name\n// also: Marijuana('delta-9'), Marijuana(9), Marijuana('Δ9')",
        run: () => Substances.Marijuana.delta(9).name
      },
      {
        title: 'Every nicotine product, one grammar',
        note: 'Cigarettes (default), vapes/e-cigs, pouches, gum, patches, cigars, rolling tobacco.',
        code: "Substances.Nicotine('e-cig').Usage.Year(2023)",
        run: () => Substances.Nicotine('e-cig').Usage.Year(2023)
      },
      {
        title: 'Unknown selectors teach the grammar',
        code: "Substances.Cocaine('speedball')",
        run: () => Substances.Cocaine('speedball'),
        throws: true
      }
    ]
  },
  {
    id: 'time',
    heading: 'Time grains: Year, Month, Day, Series',
    blurb:
      'Annual data serves directly. Sub-annual values are honest derivations: counts divide across months/days and carry their formula; a prevalence percentage refuses to divide, loudly.',
    examples: [
      {
        title: 'A full series, sorted and resolved',
        code: 'Substances.Opioids.Deaths.Series().map((p) => [p.year, p.val])',
        run: () => Substances.Opioids.Deaths.Series().map((p) => [p.year, p.val])
      },
      {
        title: 'Derived month — formula disclosed',
        code: 'Substances.Opioids.Deaths.Month(2023, 6)',
        run: () => Substances.Opioids.Deaths.Month(2023, 6)
      },
      {
        title: 'Percentages refuse to divide',
        note: '"21.8% used this year" does not mean "1.8% used in March".',
        code: 'Substances.Marijuana.Usage.Month(2023, 6)',
        run: () => Substances.Marijuana.Usage.Month(2023, 6),
        throws: true
      },
      {
        title: 'Errors are coverage maps',
        note: 'A missing year tells you what exists instead.',
        code: 'Substances.Marijuana.Usage.Year(1999)',
        run: () => Substances.Marijuana.Usage.Year(1999),
        throws: true
      }
    ]
  },
  {
    id: 'citations',
    heading: 'Citations & claim comparison',
    blurb:
      'Each citation records the value as that source reports it, so disagreements between publications are preserved — never averaged away.',
    examples: [
      {
        title: 'Show me exactly where this came from',
        code: "getCitations('usage.cannabis.us.past_year', 2023)",
        run: () => getCitations('usage.cannabis.us.past_year', 2023)
      },
      {
        title: 'A contested number, preserved',
        note: "SAMHSA's 2021 report says 18.7%; its 2024 report restates 2021 as 19.0%.",
        code: "compareClaims('usage.cannabis.us.past_year', 2021)",
        run: () => compareClaims('usage.cannabis.us.past_year', 2021)
      },
      {
        title: 'The source catalog',
        code: "getSource('cdc_wonder')",
        run: () => getSource('cdc_wonder')
      }
    ]
  },
  {
    id: 'lowlevel',
    heading: 'Low-level API',
    blurb:
      'The fluent tree is sugar over a flat, queryable dataset registry. Everything stays exported for whatever the tree does not cover.',
    examples: [
      {
        title: 'Query by substance and geography',
        code: "queryMetrics({ substance: 'CANNABIS', geo: 'TX' }).map((m) => m.id)",
        run: () => queryMetrics({ substance: 'CANNABIS', geo: 'TX' }).map((m) => m.id)
      },
      {
        title: 'Free-text search',
        code: "queryMetrics({ search: 'overdose' }).map((m) => m.id)",
        run: () => queryMetrics({ search: 'overdose' }).map((m) => m.id)
      },
      {
        title: 'Audit any dataset against the citation policy',
        note: 'An empty array means every observation passes.',
        code: "validateDataset(getMetric('deaths.opioids.us.overdose'))",
        run: () => validateDataset(getMetric('deaths.opioids.us.overdose'))
      },
      {
        title: 'The whole source catalog',
        code: 'Object.keys(getAllSources()).length',
        run: () => Object.keys(getAllSources()).length
      }
    ]
  }
]
