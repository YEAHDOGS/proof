import { describe, it, expect } from 'vitest'
import { rampStep } from './ramp.js'

const STEPS = 7

describe('rampStep', () => {
  it('places the minimum on step 1 and the maximum on the top step', () => {
    expect(rampStep(1, 1, 1000, STEPS)).toBe(1)
    expect(rampStep(1000, 1, 1000, STEPS)).toBe(7)
  })

  it('places the geometric midpoint on the middle step', () => {
    // log-midpoint of [1, 1e6] is 1e3 -> t = 0.5 -> step 1 + round(3) = 4
    expect(rampStep(1000, 1, 1_000_000, STEPS)).toBe(4)
  })

  it('is logarithmic: equal ratios step equally', () => {
    const a = rampStep(10, 1, 10_000, STEPS)
    const b = rampStep(100, 1, 10_000, STEPS)
    const c = rampStep(1000, 1, 10_000, STEPS)
    expect(b - a).toBe(c - b)
  })

  it('lands non-positive values on step 1 instead of NaN', () => {
    expect(rampStep(0, 1, 1000, STEPS)).toBe(1)
    expect(rampStep(-50, 1, 1000, STEPS)).toBe(1)
  })

  it('lands degenerate ranges on step 1', () => {
    expect(rampStep(10, 5, 5, STEPS)).toBe(1) // max <= min
    expect(rampStep(10, 0, 100, STEPS)).toBe(1) // min <= 0
    expect(rampStep(10, -3, 100, STEPS)).toBe(1)
  })

  it('clamps values above the max to the top step', () => {
    expect(rampStep(1e9, 1, 1000, STEPS)).toBe(7)
  })
})
