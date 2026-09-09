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

  it('rejects invalid sort orders', () => {
    expect(() => getSortedPoints('usage.cannabis.us.past_year', 'ascending')).toThrow(/Invalid order/)
    expect(() => getSortedPoints('usage.cannabis.us.past_year', 'DESC')).toThrow(/Invalid order/)
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

describe('registry integrity', () => {
  it('has unique dataset ids, no empty series, no duplicate years', () => {
    const all = getAllMetrics()
    const ids = all.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const m of all) {
      expect(m.observations.length, `${m.id} has no observations`).toBeGreaterThan(0)
      const years = m.observations.map((p) => p.year)
      expect(new Set(years).size, `${m.id} repeats a year`).toBe(years.length)
    }
  })

  it('marks at most one default dataset per (substance, family, geo, variant)', () => {
    const key = (m) => `${m.substance}|${m.id.split('.')[0]}|${m.geo}|${m.variant ?? ''}`
    const groups = new Map()
    for (const m of getAllMetrics()) {
      const k = key(m)
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k).push(m)
    }
    for (const [k, files] of groups) {
      const defaults = files.filter((m) => m.default === true)
      expect(defaults.length, `multiple defaults in ${k}`).toBeLessThanOrEqual(1)
    }
  })
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
