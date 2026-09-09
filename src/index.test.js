import { describe, it, expect } from 'vitest'
import {
  getAllMetrics,
  queryMetrics,
  getMetric,
  getSortedPoints,
  getAllSources,
  getSource,
  getCitations,
  compareClaims,
  validateDataset
} from './index.js'

describe('queryMetrics', () => {
  it('loads every YAML dataset under src/data/', () => {
    const all = getAllMetrics()
    expect(all.length).toBeGreaterThanOrEqual(15)
    const ids = all.map((m) => m.id)
    expect(ids).toContain('usage.cannabis.us.past_year')
    expect(ids).toContain('usage.alcohol.us.past_month')
    expect(ids).toContain('usage.cannabis.tx.past_year')
    expect(ids).toContain('deaths.opioids.us.overdose')
    expect(ids).toContain('er_visits.cannabis.us.ed_visits')
    expect(ids).toContain('sales.cannabis.tx.retail')
  })

  it('covers every substance family with at least one dataset (M2)', () => {
    const covered = new Set(getAllMetrics().map((m) => m.substance))
    for (const substance of [
      'CANNABIS',
      'ALCOHOL',
      'NICOTINE',
      'COCAINE',
      'HEROIN',
      'FENTANYL',
      'OPIOIDS',
      'AMPHETAMINES',
      'PSYCHEDELICS'
    ]) {
      expect(covered, `${substance} has no datasets`).toContain(substance)
    }
  })

  it('filters by substance', () => {
    const cannabis = queryMetrics({ substance: 'CANNABIS' })
    expect(cannabis.length).toBeGreaterThanOrEqual(5)
    expect(cannabis.every((m) => m.substance === 'CANNABIS')).toBe(true)
    const families = new Set(cannabis.map((m) => m.id.split('.')[0]))
    expect(families).toContain('usage')
    expect(families).toContain('deaths')
    expect(families).toContain('er_visits')
    expect(families).toContain('sales')
  })

  it('filters by substance and geo together', () => {
    const txCannabis = queryMetrics({ substance: 'CANNABIS', geo: 'TX' })
    expect(txCannabis.every((m) => m.substance === 'CANNABIS' && m.geo === 'TX')).toBe(true)
    const ids = txCannabis.map((m) => m.id)
    expect(ids).toContain('usage.cannabis.tx.past_year')
    expect(ids).toContain('sales.cannabis.tx.retail')
  })

  it('matches free-text search against title and description', () => {
    const hits = queryMetrics({ search: 'texas' })
    const ids = hits.map((m) => m.id)
    expect(ids).toContain('usage.cannabis.tx.past_year')
    expect(ids).toContain('deaths.alcohol.tx.excess')
    expect(hits.every((m) => `${m.id} ${m.title} ${m.metric} ${m.description ?? ''}`.toLowerCase().includes('texas'))).toBe(true)
  })

  it('returns fully-shaped MetricFile objects from YAML', () => {
    const metric = getMetric('usage.cannabis.us.past_year')
    expect(metric).toBeDefined()
    expect(metric.substance).toBe('CANNABIS')
    expect(metric.geo).toBe('US')
    expect(metric.unit).toBe('percent_population_12_plus')
    expect(metric.verification).toBe('cross-checked')
    expect(Array.isArray(metric.observations)).toBe(true)
    for (const point of metric.observations) {
      expect(typeof point.year).toBe('number')
      expect(typeof point.val).toBe('number')
      expect(point.citations.length).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('getSortedPoints', () => {
  it('sorts ascending by default', () => {
    const points = getSortedPoints('usage.alcohol.us.past_month')
    const years = points.map((p) => p.year)
    expect(years).toEqual([...years].sort((a, b) => a - b))
    expect(years[0]).toBe(2021)
  })

  it('sorts descending on request', () => {
    const points = getSortedPoints('usage.cannabis.us.past_year', 'desc')
    expect(points[0].year).toBe(2024)
    expect(points.at(-1).year).toBe(2021)
  })

  it('does not mutate the underlying dataset', () => {
    const before = getMetric('usage.cannabis.us.past_year').observations.map((p) => p.year)
    getSortedPoints('usage.cannabis.us.past_year', 'desc')
    const after = getMetric('usage.cannabis.us.past_year').observations.map((p) => p.year)
    expect(after).toEqual(before)
  })

  it('throws on an unknown metric id', () => {
    expect(() => getSortedPoints('nope.nothing')).toThrow(/Unknown metric id/)
  })
})

describe('sources and citations', () => {
  it('exposes the source catalog with real URLs', () => {
    const sources = getAllSources()
    expect(Object.keys(sources).length).toBeGreaterThanOrEqual(5)
    for (const [anchor, source] of Object.entries(sources)) {
      expect(source.url, `${anchor} url`).toMatch(/^https:\/\//)
      expect(source.name, `${anchor} name`).toBeTruthy()
      expect(source.publisher, `${anchor} publisher`).toBeTruthy()
    }
    expect(getSource('samhsa_nsduh').publisher).toBe('SAMHSA')
  })

  it('resolves every citation of an observation to full source details', () => {
    const citations = getCitations('usage.cannabis.tx.past_year', 2023)
    expect(citations.length).toBeGreaterThanOrEqual(2)
    for (const c of citations) {
      expect(c.source.url).toMatch(/^https:\/\//)
    }
  })

  it('records cross-source disagreement instead of averaging it away', () => {
    // SAMHSA's 2021 report says 18.7%; its 2024 report restates 2021 as 19.0%.
    const comparison = compareClaims('usage.cannabis.us.past_year', 2021)
    expect(comparison.corroborated).toBe(true)
    expect(comparison.claimed).toContain(18.7)
    expect(comparison.claimed).toContain(19.0)
    expect(comparison.spread).toBeCloseTo(0.3)
    expect(comparison.consensus).toBe(18.7)
  })
})

describe('one measure per dataset', () => {
  it('keeps legalization outcome measures in separate files', () => {
    // Regression: these three outcomes used to share one id with three
    // same-year observations, so Year()/getCitations() silently returned
    // only the first (-0.11) and hid the other two. One file, one measure.
    const mortality = getMetric('policy.cannabis.us.legalization_opioid_mortality')
    const traffic = getMetric('policy.cannabis.us.legalization_traffic_fatalities')
    const youth = getMetric('policy.cannabis.us.legalization_youth_use')
    expect(mortality).toBeDefined()
    expect(traffic).toBeDefined()
    expect(youth).toBeDefined()
    expect(getMetric('policy.cannabis.us.legalization_outcomes')).toBeUndefined()
    for (const metric of [mortality, traffic, youth]) {
      expect(metric.observations.length).toBe(1)
      expect(validateDataset(metric)).toEqual([])
    }
    expect(mortality.observations[0].val).toBe(-0.11)
    expect(traffic.observations[0].val).toBe(0.19)
    expect(youth.observations[0].val).toBe(0.0)
    expect(mortality.observations[0].year).toBe(2023)
  })

  it('resolves citations for every split outcome independently', () => {
    const mortality = getCitations('policy.cannabis.us.legalization_opioid_mortality', 2023)
    expect(mortality[0].source.publisher).toBeTruthy()
    expect(mortality[0].val).toBe(-0.11)
    const comparison = compareClaims('policy.cannabis.us.legalization_traffic_fatalities', 2023)
    expect(comparison.consensus).toBe(0.19)
    expect(comparison.claimed).toContain(0.19)
  })
})

describe('citation policy integrity', () => {
  it('every observation in every dataset passes validateDataset', () => {
    for (const metric of getAllMetrics()) {
      expect(validateDataset(metric), metric.id).toEqual([])
    }
  })

  it('every observation carries at least one citation with a value', () => {
    for (const metric of getAllMetrics()) {
      for (const point of metric.observations) {
        const withValues = point.citations.filter((c) => typeof c.val === 'number')
        expect(withValues.length, `${metric.id} @ ${point.year}`).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('every dataset declares its metric, so no val is ever ambiguous', () => {
    for (const metric of getAllMetrics()) {
      expect(typeof metric.metric, metric.id).toBe('string')
      expect(metric.metric.length, metric.id).toBeGreaterThan(0)
    }
  })

  it('every citation carries a direct https url', () => {
    for (const metric of getAllMetrics()) {
      for (const point of metric.observations) {
        for (const c of point.citations) {
          expect(c.url, `${metric.id} @ ${point.year} (${c.src})`).toMatch(/^https:\/\//)
        }
      }
    }
  })
})
