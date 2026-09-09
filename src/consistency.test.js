import { describe, it, expect } from 'vitest'
import { getAllMetrics, getMetric, getAllSources } from './index.js'
import { COMPOUNDS, REPS } from './registry.js'

// Cross-dataset consistency: every claim in one dataset must stay honest
// against the claims in the others. Pure fixtures — no live fetching.

// Drug families whose deaths are subsets of a parent category. The child
// figures must never exceed the parent figure for the same year — if they
// do, at least one dataset is wrong and a legislator-facing chart will be
// caught in it.
const SUBSET_CAPS = [
  {
    parent: 'deaths.opioids.us.overdose',
    children: ['deaths.fentanyl.us.overdose', 'deaths.heroin.us.overdose'],
    why: 'fentanyl + heroin overdose deaths cannot exceed total opioid deaths'
  }
]

// Where else citation anchors may legitimately live besides observation
// citations: compound sheets and representative baselines.
function anchorsUsedOutsideObservations() {
  const used = new Set()
  for (const substance of Object.values(COMPOUNDS.substances ?? {})) {
    for (const compound of Object.values(substance)) {
      for (const anchor of compound.sources ?? []) used.add(anchor)
    }
  }
  for (const place of Object.values(REPS.places ?? {})) {
    for (const anchor of place.sources ?? []) used.add(anchor)
  }
  return used
}

describe('data table consistency', () => {
  it('never reports the same year twice inside one dataset', () => {
    for (const metric of getAllMetrics()) {
      const years = metric.observations.map((p) => p.year)
      const unique = new Set(years)
      expect(unique.size, `${metric.id} has duplicate years`).toBe(years.length)
    }
  })

  it('restates every observation value in at least one citation, or marks it contested', () => {
    for (const metric of getAllMetrics()) {
      for (const point of metric.observations) {
        if (typeof point.val !== 'number') continue
        const restated = point.citations.some((c) => c.val === point.val)
        const contested = point.basis === 'contested'
        expect(
          restated || contested,
          `${metric.id} @ ${point.year}: value ${point.val} is restated by no citation`
        ).toBe(true)
      }
    }
  })

  it('keeps subset deaths at or below their parent category, year by year', () => {
    for (const { parent, children, why } of SUBSET_CAPS) {
      const parentMetric = getMetric(parent)
      for (const childId of children) {
        const child = getMetric(childId)
        for (const point of child.observations) {
          const parentPoint = parentMetric.observations.find((p) => p.year === point.year)
          expect(parentPoint, `${parent} has no ${point.year} to cap ${childId}`).toBeDefined()
          expect(point.val, `${childId} @ ${point.year}: ${why}`).toBeLessThanOrEqual(
            parentPoint.val
          )
        }
      }
    }
  })

  it('has no orphaned source anchors: every catalog entry is cited or reserved', () => {
    const cited = new Set()
    for (const metric of getAllMetrics()) {
      for (const point of metric.observations) {
        for (const c of point.citations) cited.add(c.src)
      }
    }
    for (const anchor of anchorsUsedOutsideObservations()) cited.add(anchor)

    for (const anchor of Object.keys(getAllSources())) {
      const source = getAllSources()[anchor]
      const reserved = /reserved/i.test(source.note ?? '')
      expect(
        cited.has(anchor) || reserved,
        `source '${anchor}' is cited nowhere and not marked reserved`
      ).toBe(true)
    }
  })
})
