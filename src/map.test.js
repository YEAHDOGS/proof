import { describe, it, expect } from 'vitest'
import { metricToMapCountries } from './map.js'

/** Minimal MetricFile shape for the adapter (citations unused here). */
function file(overrides = {}) {
  return {
    id: 'deaths.test.us.x',
    geo: 'US',
    metric: 'overdose_deaths',
    unit: 'deaths',
    title: 'Test deaths',
    verification: 'seeded',
    observations: [{ year: 2024, val: 54_743, citations: [] }],
    ...overrides
  }
}

describe('metricToMapCountries', () => {
  it('maps a US file to the us polygon with the latest observation', () => {
    const countries = metricToMapCountries(
      file({ observations: [
        { year: 2023, val: 83_140, citations: [] },
        { year: 2024, val: 54_743, citations: [] }
      ] })
    )
    expect(countries).toEqual([
      { code: 'us', name: 'United States', num: 54_743, value: '54.7K' }
    ])
  })

  it('keeps a genuine zero (cannabis) instead of dropping it', () => {
    const countries = metricToMapCountries(file({ observations: [{ year: 2023, val: 0, citations: [] }] }))
    expect(countries).toEqual([
      { code: 'us', name: 'United States', num: 0, value: '0' }
    ])
  })

  it('honors a custom formatValue', () => {
    const countries = metricToMapCountries(file(), { formatValue: (v) => `~${v}` })
    expect(countries[0].value).toBe('~54743')
  })

  it('returns [] for WORLD, TX, and unknown geos — never throws', () => {
    expect(metricToMapCountries(file({ geo: 'WORLD' }))).toEqual([])
    expect(metricToMapCountries(file({ geo: 'TX' }))).toEqual([])
    expect(metricToMapCountries(file({ geo: 'XX' }))).toEqual([])
  })

  it('returns [] for missing/empty observations and null input', () => {
    expect(metricToMapCountries(file({ observations: [] }))).toEqual([])
    expect(metricToMapCountries(file({ observations: [{ year: 2024, citations: [] }] }))).toEqual([])
    expect(metricToMapCountries(null)).toEqual([])
    expect(metricToMapCountries(undefined)).toEqual([])
  })
})
