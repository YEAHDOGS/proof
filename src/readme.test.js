import { describe, it, expect } from 'vitest'
import { Substances, World } from './index.js'

/**
 * README regression guard. The README's opening import used to name exports
 * that don't exist (USReps, VisualMap) and nothing caught it — every code
 * example in the README must execute against the real library, same contract
 * as the docs site's live examples (src/docs/examples.js).
 */
describe('README examples', () => {
  it('quick-start block runs', () => {
    expect(+Substances.Marijuana.Usage.Year(2023)).toBeCloseTo(21.8, 5)
    expect(Substances.Marijuana.Usage.Year(2023).Cite.length).toBeGreaterThanOrEqual(1)
    expect(+Substances.Marijuana.Usage.Year(2023, { geo: 'TX' })).toBeGreaterThan(0)
    expect(Substances.Marijuana('delta-8').key).toBe('delta-8')
    expect(Substances.Cocaine('p')).toBe(Substances.Cocaine.Powder)
  })

  it('data-coverage block runs', () => {
    expect(+Substances.Fentanyl.Deaths.Year(2023)).toBe(72_776)
    expect(+Substances.Marijuana.Deaths.Year(2023)).toBe(0)
    expect(+Substances.Alcohol.Deaths.Year(2021)).toBe(178_307)
    expect(+Substances.Marijuana.Sales.Year(2025, { geo: 'TX' })).toBe(5_500_000_000)
    expect(+Substances.Alcohol.Usage('world')).toBe(2_300_000_000)
    expect(Substances.Alcohol.Usage('world').Cite.length).toBeGreaterThanOrEqual(1)
    expect(+World.Population('us', 'texas')).toBe(31_290_831)
    expect(World.Representatives('us', 'texas').Senators.seats).toBeGreaterThan(0)
  })

  it('chart snippet data runs', () => {
    const points = Substances.Fentanyl.Deaths.Series()
    expect(points.length).toBeGreaterThan(0)
    expect(points.every((p) => typeof p.year === 'number' && typeof p.val === 'number')).toBe(true)
  })
})
