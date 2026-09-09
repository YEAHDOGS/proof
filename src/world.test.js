import { describe, it, expect } from 'vitest'
import { World } from './index.js'

describe('World.Population', () => {
  it('resolves the whole world by default, most recent year', () => {
    const world = World.Population()
    expect(world.year).toBe(2025)
    expect(world.val).toBe(8_230_000_000)
    expect(world.geo).toBe('WORLD')
  })

  it('narrows by hierarchical place path', () => {
    expect(World.Population('us').val).toBe(341_145_670)
    expect(World.Population('us', 'texas').val).toBe(31_290_831)
    expect(World.Population('texas').val).toBe(31_290_831)
  })

  it('keeps the year selectable', () => {
    expect(World.Population().Year(2024).val).toBe(8_160_000_000)
    expect(World.Population('us', 'texas').Year(2023).val).toBe(30_727_890)
    expect(World.Population('us').Year('2024').val).toBe(340_110_988)
  })

  it('returns Stats: numbers with receipts', () => {
    expect(+World.Population()).toBe(8_230_000_000)
    expect(World.Population().metric).toBe('population')
    expect(World.Population('us', 'texas') / World.Population('us')).toBeCloseTo(0.0917, 3)
    expect(World.Population().Cite.length).toBeGreaterThanOrEqual(1)
    expect(World.Population('us').Year(2024).Cite[0].source.publisher).toBe('U.S. Census Bureau')
  })

  it('serves a sorted series with periods disclosed', () => {
    const series = World.Population('us', 'texas').Series()
    expect(series.map((p) => p.year)).toEqual([2023, 2024])
    expect(series.every((p) => typeof p.period === 'string')).toBe(true)
  })

  it('is case-insensitive and alias-friendly', () => {
    expect(World.population('USA').val).toBe(341_145_670)
    expect(World.Population('Global').val).toBe(8_230_000_000)
  })

  it('throws usable errors', () => {
    expect(() => World.Population('mars')).toThrow(/Unknown geography 'mars'/)
    expect(() => World.Population().Year(1999)).toThrow(/Years available: 2024, 2025/)
    expect(() => World.Population().Month(2025, 6)).toThrow(/annual baseline/)
  })

  it('rejects loose year spellings instead of silently truncating them', () => {
    expect(() => World.Population().Year('2024abc')).toThrow(/Invalid year/)
    expect(() => World.Population().Year('2024.0')).toThrow(/Invalid year/)
    expect(World.Population().Year(' 2024 ').val).toBe(8_160_000_000)
  })
})

describe('World.Representatives', () => {
  it('resolves the Texas delegation with its senators', () => {
    const tx = World.Representatives('us', 'texas')
    expect(tx.name).toBe('Texas')
    expect(tx.Senators.seats).toBe(2)
    expect(tx.Senators.members.map((m) => m.name)).toEqual(['John Cornyn', 'Ted Cruz'])
    expect(tx.House.seats).toBe(38)
    expect(tx.StateSenate.seats).toBe(31)
    expect(tx.StateHouse.seats).toBe(150)
  })

  it('resolves the US Congress structurally', () => {
    const us = World.Representatives('us')
    expect(us.Senators.seats).toBe(100)
    expect(us.House.seats).toBe(435)
    expect(us.StateSenate).toBeUndefined()
  })

  it('attaches resolved sources via Cite', () => {
    const cite = World.Representatives('us', 'texas').Cite
    expect(cite.length).toBeGreaterThanOrEqual(2)
    for (const source of cite) expect(source.url).toMatch(/^https:\/\//)
  })

  it('is case-insensitive on properties and places', () => {
    expect(World.representatives('texas').senators.seats).toBe(2)
  })

  it('requires a country-level place', () => {
    expect(() => World.Representatives()).toThrow(/Pass a country/)
    expect(() => World.Representatives('narnia')).toThrow(/Unknown geography/)
  })
})
