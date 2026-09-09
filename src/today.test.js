import { describe, it, expect } from 'vitest'
import { deathsPerDay, deathsToday } from './today.js'

function file(overrides = {}) {
  return {
    id: 'deaths.test.us.x',
    geo: 'US',
    metric: 'overdose_deaths',
    unit: 'deaths',
    title: 'Test deaths',
    verification: 'seeded',
    observations: [{ year: 2024, val: 36_500, citations: [] }],
    ...overrides
  }
}

describe('deathsPerDay', () => {
  it('divides the latest annual count by 365 and labels the estimate', () => {
    const est = deathsPerDay(file())
    expect(est.val).toBeCloseTo(100, 10)
    expect(est.year).toBe(2024)
    expect(est.unit).toBe('deaths_per_day')
    expect(est.basis).toBe('estimated')
    expect(est.note).toMatch(/not a measured count/i)
    expect(est.metricId).toBe('deaths.test.us.x')
  })

  it('uses the latest year when several observations exist', () => {
    const est = deathsPerDay(
      file({ observations: [
        { year: 2022, val: 36_500, citations: [] },
        { year: 2024, val: 73_000, citations: [] }
      ] })
    )
    expect(est.year).toBe(2024)
    expect(est.val).toBeCloseTo(200, 10)
  })

  it('accepts the deaths_per_year unit too', () => {
    expect(deathsPerDay(file({ unit: 'deaths_per_year' })).val).toBeCloseTo(100, 10)
  })

  it('keeps a genuine zero (cannabis): 0/day is an estimate, not a gap', () => {
    const est = deathsPerDay(file({ observations: [{ year: 2023, val: 0, citations: [] }] }))
    expect(est.val).toBe(0)
    expect(est.basis).toBe('estimated')
  })

  it('returns null for non-death metrics, empty data, and null input', () => {
    expect(deathsPerDay(file({ unit: 'percent_population_12_plus' }))).toBeNull()
    expect(deathsPerDay(file({ unit: 'usd' }))).toBeNull()
    expect(deathsPerDay(file({ observations: [] }))).toBeNull()
    expect(deathsPerDay(null)).toBeNull()
    expect(deathsPerDay(undefined)).toBeNull()
  })
})

describe('deathsToday', () => {
  it('prorates by the fraction of the local day elapsed', () => {
    // 06:00 local -> exactly one quarter of the day gone.
    const now = new Date(2026, 8, 9, 6, 0, 0)
    const est = deathsToday(file(), now)
    expect(est.val).toBeCloseTo(25, 10) // 100/day x 0.25
    expect(est.unit).toBe('deaths')
    expect(est.basis).toBe('estimated')
    expect(est.note).toMatch(/not a measured count/i)
    expect(est.note).toMatch(/25\.0%/)
  })

  it('is zero at midnight and the full day rate just before midnight', () => {
    const midnight = new Date(2026, 8, 9, 0, 0, 0)
    expect(deathsToday(file(), midnight).val).toBeCloseTo(0, 10)
    const late = new Date(2026, 8, 9, 23, 59, 59)
    expect(deathsToday(file(), late).val).toBeCloseTo(100, 1)
  })

  it('returns null for non-death metrics', () => {
    expect(deathsToday(file({ unit: 'usd' }), new Date(2026, 8, 9, 12))).toBeNull()
  })
})
