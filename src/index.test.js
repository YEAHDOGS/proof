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
    expect(all.length).toBeGreaterThanOrEqual(3)
    const ids = all.map((m) => m.id)
    expect(ids).toContain('usage.cannabis.us.past_year')
    expect(ids).toContain('usage.alcohol.us.past_month')
    expect(ids).toContain('usage.cannabis.tx.past_year')
  })

  it('filters by substance', () => {
    const cannabis = queryMetrics({ substance: 'CANNABIS' })
    expect(cannabis.length).toBe(2)
    expect(cannabis.every((m) => m.substance === 'CANNABIS')).toBe(true)
  })

  it('filters by substance and geo together', () => {
    const txCannabis = queryMetrics({ substance: 'CANNABIS', geo: 'TX' })
    expect(txCannabis.map((m) => m.id)).toEqual(['usage.cannabis.tx.past_year'])
  })

  it('matches free-text search against title and description', () => {
    const hits = queryMetrics({ search: 'texas' })
    expect(hits.map((m) => m.id)).toEqual(['usage.cannabis.tx.past_year'])
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
      expect(typeof point.src).toBe('string')
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
})
