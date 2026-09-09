import { describe, it, expect } from 'vitest'
import { Substances } from './index.js'

describe('Substances fluent tree', () => {
  it('reads a US observation by year, number or string', () => {
    const byNumber = Substances.Marijuana.Usage.Year(2023)
    const byString = Substances.Marijuana.Usage.Year('2023')
    expect(byNumber.val).toBe(21.8)
    expect(byString.val).toBe(21.8)
    expect(byNumber.metricId).toBe('usage.cannabis.us.past_year')
    expect(byNumber.geo).toBe('US')
  })

  it('reads Texas via the geo option, carrying the true period', () => {
    const tx = Substances.Marijuana.Usage.Year(2023, { geo: 'TX' })
    expect(tx.val).toBe(16.41)
    expect(tx.period).toBe('2022-2023 annual average')
  })

  it('accepts friendly geo aliases in every opts.geo path', () => {
    expect(Substances.Marijuana.Usage.Year(2023, { geo: 'us' }).val).toBe(21.8)
    expect(Substances.Marijuana.Usage.Year(2023, { geo: 'USA' }).val).toBe(21.8)
    expect(Substances.Alcohol.Deaths.Year(2021, { geo: 'texas' }).geo).toBe('TX')
    const series = Substances.Alcohol.Deaths.Series({ geo: 'texas' })
    expect(series.length).toBeGreaterThan(0)
    expect(series.every((p) => p.geo === 'TX')).toBe(true)
    const files = Substances.Marijuana.Usage.Files({ geo: 'us' })
    expect(files.length).toBeGreaterThan(0)
    expect(files.every((f) => f.geo === 'US')).toBe(true)
    expect(Substances.Alcohol.Deaths.Month(2021, 6, { geo: 'tx' }).from.geo).toBe('TX')
  })

  it('is case-insensitive at every level', () => {
    expect(Substances.marijuana.usage.year(2023).val).toBe(21.8)
    expect(Substances.MARIJUANA.Usage.Year(2023).val).toBe(21.8)
    expect(Substances.alcohol.Usage.Year(2026).val).toBe(178_700_000)
  })

  it('resolves aliases: Cannabis, Weed, Psychadelics, Tobacco', () => {
    expect(Substances.Cannabis).toBe(Substances.Marijuana)
    expect(Substances.Weed).toBe(Substances.Marijuana)
    expect(Substances.Psychadelics).toBe(Substances.Psychedelics)
    expect(Substances.Tobacco).toBe(Substances.Nicotine)
  })

  it('never returns a number without its citations', () => {
    const obs = Substances.Alcohol.Usage.Year(2026)
    expect(obs.citations.length).toBeGreaterThanOrEqual(2)
    for (const c of obs.citations) {
      expect(c.source.url).toMatch(/^https:\/\//)
    }
  })

  it('preserves contested values instead of averaging', () => {
    const obs = Substances.Marijuana.Usage.Year(2021)
    expect(obs.basis).toBe('contested')
    const claimed = obs.citations.map((c) => c.val).filter((v) => typeof v === 'number')
    expect(claimed).toContain(18.7)
    expect(claimed).toContain(19.0)
  })

  it('returns a sorted, resolved series', () => {
    const series = Substances.Marijuana.Usage.Series({ order: 'desc' })
    expect(series[0].year).toBe(2024)
    expect(series.at(-1).year).toBe(2021)
    expect(series.every((p) => p.citations.length >= 1)).toBe(true)
  })

  it('refuses to divide a prevalence percentage into months', () => {
    expect(() => Substances.Marijuana.Usage.Month(2023, 6)).toThrow(/percent/)
    expect(() => Substances.Marijuana.Usage.Day(2023, 6, 15)).toThrow(/percent/)
  })

  it('throws an actionable error when a family has no data yet', () => {
    expect(() => Substances.Psychedelics.Sales.Year(2026)).toThrow(/No PSYCHEDELICS Sales in US dataset/)
    expect(() => Substances.Psychedelics.Sales.Year(2026)).toThrow(/Available PSYCHEDELICS datasets/)
    expect(() => Substances.Cocaine.Crack.Deaths.Year(2023)).toThrow(/No COCAINE \(crack\) Deaths in US dataset/)
  })

  it('throws with available years when the year is missing', () => {
    expect(() => Substances.Marijuana.Usage.Year(1999)).toThrow(/Years available: 2021, 2022, 2023, 2024/)
  })

  it('points at sibling datasets when the default file lacks the year', () => {
    // The default alcohol Usage dataset only carries 2026; the cross-checked
    // 2021-2024 series lives under another metric for the same family+geo.
    expect(() => Substances.Alcohol.Usage.Year(2023)).toThrow(/usage\.alcohol\.us\.past_month/)
    expect(() => Substances.Alcohol.Usage.Year(2023)).toThrow(/\{ metric: 'past_month_use' \}/)
  })

  it('validates year, month, and day inputs', () => {
    expect(() => Substances.Marijuana.Usage.Year('soon')).toThrow(/Invalid year/)
    expect(() => Substances.Marijuana.Usage.Month(2023, 13)).toThrow(/Invalid month/)
    expect(() => Substances.Marijuana.Usage.Day(2023, 2, 30)).toThrow(/Invalid day/)
  })

  it('rejects invalid Series sort orders', () => {
    // 'asc'/'desc' only — anything else used to silently sort ascending
    expect(() => Substances.Marijuana.Usage.Series({ order: 'ascending' })).toThrow(/Invalid order/)
    expect(() => Substances.Marijuana.Usage('us').Series({ order: 'DESC' })).toThrow(/Invalid order/)
    // the valid spellings still behave
    expect(Substances.Marijuana.Usage.Series({ order: 'desc' })[0].year).toBe(2024)
    expect(Substances.Marijuana.Usage.Series({ order: 'asc' })[0].year).toBe(2021)
  })

  it('accepts strict month/day spellings like the year and delta selectors', () => {
    // numeric strings and padding are tolerated, matching toYear/strictInt
    const byNumber = Substances.Opioids.Deaths.Month(2023, 6)
    expect(Substances.Opioids.Deaths.Month(2023, '6')).toEqual(byNumber)
    expect(Substances.Opioids.Deaths.Month(2023, ' 06 ')).toEqual(byNumber)
    const day = Substances.Fentanyl.Deaths.Day(2023, 3, 14)
    expect(Substances.Fentanyl.Deaths.Day(2023, '3', '14')).toEqual(day)
    expect(Substances.Fentanyl.Deaths.Day('2023', ' 3 ', '14')).toEqual(day)
    // loose spellings are rejected, not silently truncated
    expect(() => Substances.Opioids.Deaths.Month(2023, '6abc')).toThrow(/Invalid month/)
    expect(() => Substances.Opioids.Deaths.Month(2023, 6.5)).toThrow(/Invalid month/)
    expect(() => Substances.Fentanyl.Deaths.Day(2023, 3, '14x')).toThrow(/Invalid day/)
    expect(() => Substances.Fentanyl.Deaths.Day(2023, 3, 14.5)).toThrow(/Invalid day/)
    expect(() => Substances.Fentanyl.Deaths.Day(2023, '3.5', 14)).toThrow(/Invalid month/)
    // month stays clamped to 1-12, day to the real calendar (leap-aware)
    expect(() => Substances.Opioids.Deaths.Month(2023, 0)).toThrow(/Invalid month/)
    expect(() => Substances.Fentanyl.Deaths.Day(2023, 3, 0)).toThrow(/Invalid day/)
    // day is clamped to the real calendar (leap-aware); validation runs
    // before the year lookup, so Feb 29 2024 passes validation and reaches
    // the year check instead of the day check
    expect(() => Substances.Fentanyl.Deaths.Day(2024, 2, 29)).toThrow(/No 2024 observation/)
    expect(() => Substances.Fentanyl.Deaths.Day(2023, 2, 29)).toThrow(/Invalid day/)
    expect(() => Substances.Fentanyl.Deaths.Day(2024, 2, 30)).toThrow(/Invalid day/)
  })

  it('rejects absurd years outside the 1-9999 calendar range', () => {
    // year 0 is not a calendar year, negatives and 5+ digit years are absurd
    expect(() => Substances.Marijuana.Usage.Year(0)).toThrow(/Invalid year/)
    expect(() => Substances.Marijuana.Usage.Year(-44)).toThrow(/Invalid year/)
    expect(() => Substances.Marijuana.Usage.Year(10000)).toThrow(/Invalid year/)
    expect(() => Substances.Marijuana.Usage.Year(' 100000 ')).toThrow(/Invalid year/)
    // sanity range applies to all selectors, not just Year
    expect(() => Substances.Opioids.Deaths.Month(0, 6)).toThrow(/Invalid year/)
    expect(() => Substances.Fentanyl.Deaths.Day(10000, 3, 14)).toThrow(/Invalid year/)
    // an in-range year with no data passes validation and reaches the lookup
    expect(() => Substances.Marijuana.Usage.Year(2100)).toThrow(/No 2100 observation/)
  })

  it('handles Feb 29 end-to-end under century leap rules', () => {
    // 2000 is a leap year (divisible by 400): passes day validation,
    // then reaches the year lookup since the dataset has no 2000 row
    expect(() => Substances.Fentanyl.Deaths.Day(2000, 2, 29)).toThrow(/No 2000 observation/)
    // 2100 is NOT a leap year (divisible by 100, not 400): rejected as a day
    expect(() => Substances.Fentanyl.Deaths.Day(2100, 2, 29)).toThrow(/Invalid day/)
    expect(() => Substances.Fentanyl.Deaths.Day(2100, 2, 28)).toThrow(/No 2100 observation/)
  })

  it('rejects loose year spellings instead of silently truncating them', () => {
    // parseInt('2023.5') used to return 2023; now it must throw.
    expect(() => Substances.Marijuana.Usage.Year('2023.5')).toThrow(/Invalid year/)
    expect(() => Substances.Marijuana.Usage.Year('2023abc')).toThrow(/Invalid year/)
    expect(() => Substances.Marijuana.Usage.Year('0x2023')).toThrow(/Invalid year/)
    expect(() => Substances.Marijuana.Usage.Year(2023.5)).toThrow(/Invalid year/)
    // padding stays tolerated, like the geo aliases
    expect(Substances.Marijuana.Usage.Year(' 2023 ').val).toBe(21.8)
  })

  it('carries the metric name on every resolved and derived value', () => {
    expect(Substances.Fentanyl.Deaths.Year(2023).metric).toBe('overdose_deaths')
    expect(Substances.Marijuana.Usage.Year(2023).metric).toBe('past_year_use')
    expect(Substances.Alcohol.Usage('world').metric).toBe('past_year_users')
    expect(Substances.Opioids.Deaths.Month(2023, 6).metric).toBe('overdose_deaths')
    expect(Substances.Fentanyl.Deaths.Day(2023, 3, 14).metric).toBe('overdose_deaths')
    expect(Substances.Marijuana.Usage.Series().every((p) => p.metric === 'past_year_use')).toBe(true)
  })

  it('serves the M2 death series with citations attached', () => {
    expect(Substances.Fentanyl.Deaths.Year(2023).val).toBe(72776)
    expect(Substances.Opioids.Deaths.Year(2022).val).toBe(81806)
    expect(Substances.Heroin.Deaths.Year(2023).val).toBe(4364)
    expect(Substances.Cocaine.Deaths.Year(2023).val).toBe(29918)
    expect(Substances.Amphetamines.Deaths.Year(2023).val).toBe(36251)
    const fent = Substances.Fentanyl.Deaths.Year(2023)
    expect(fent.citations.length).toBeGreaterThanOrEqual(2)
    expect(fent.unit).toBe('deaths')
  })

  it('reports cannabis overdose deaths as a real, cited zero', () => {
    const obs = Substances.Marijuana.Deaths.Year(2023)
    expect(obs.val).toBe(0)
    expect(obs.basis).toBe('reported')
    expect(obs.citations.length).toBeGreaterThanOrEqual(2)
  })

  it('carries the modelled basis and true period on ARDI alcohol deaths', () => {
    const us = Substances.Alcohol.Deaths.Year(2021)
    expect(us.val).toBe(178307)
    expect(us.basis).toBe('modelled')
    expect(us.period).toBe('2020-2021 annual average')
    expect(Substances.Alcohol.Deaths.Year(2021, { geo: 'TX' }).val).toBe(13701)
  })

  it('serves ER visits and Texas sales', () => {
    expect(Substances.Marijuana.ERVisits.Year(2023).val).toBe(896418)
    expect(Substances.Alcohol.ERVisits.Year(2023).val).toBe(5370000)
    const sales = Substances.Marijuana.Sales.Year(2025, { geo: 'TX' })
    expect(sales.val).toBe(5500000000)
    expect(sales.basis).toBe('modelled')
  })

  it('derives month and day values from count units, formula disclosed', () => {
    const month = Substances.Opioids.Deaths.Month(2023, 6)
    expect(month.val).toBeCloseTo(79358 / 12)
    expect(month.basis).toBe('derived')
    expect(month.note).toMatch(/79358 deaths in 2023 \/ 12 months/)
    expect(month.from.year).toBe(2023)
    const day = Substances.Fentanyl.Deaths.Day(2023, 3, 14)
    expect(day.val).toBeCloseTo(72776 / 365)
    expect(day.note).toMatch(/365 days/)
  })

  it('exposes variant sub-nodes with the same family API', () => {
    expect(Substances.Cocaine.Crack.Usage.Files()).toEqual([])
    expect(Substances.Cocaine.Powder.Deaths.Files()).toEqual([])
    expect(Substances.Psychedelics.Mushrooms.Usage.Files()).toEqual([])
    expect(Substances.Psychedelics.LSD).toBe(Substances.Psychedelics.Acid)
    expect(Substances.Psychedelics.Shrooms).toBe(Substances.Psychedelics.Mushrooms)
  })
})

describe('geo selector, Stat values, and Cite', () => {
  it('resolves a geography down to the most recent observation', () => {
    const world = Substances.Alcohol.Usage('world')
    expect(world.year).toBe(2026)
    expect(world.val).toBe(2_300_000_000)
    expect(world.geo).toBe('WORLD')
  })

  it('Stats behave as their numeric value', () => {
    expect(+Substances.Alcohol.Usage('world')).toBe(2_300_000_000)
    expect(Substances.Alcohol.Usage('us') == 178_700_000).toBe(true)
    expect(Substances.Alcohol.Usage('world') / Substances.Alcohol.Usage('us')).toBeCloseTo(12.87, 2)
    expect(Substances.Alcohol.Usage('world') > Substances.Alcohol.Usage('us')).toBe(true)
  })

  it('chains Year and Series from the scoped node, geo pinned', () => {
    expect(Substances.Alcohol.Usage('world').Year(2026).val).toBe(2_300_000_000)
    expect(Substances.Alcohol.Usage('us').Year(2026).val).toBe(178_700_000)
    const series = Substances.Alcohol.Usage('world').Series()
    expect(series.map((p) => p.year)).toEqual([2026])
  })

  it('serves Cite on scoped nodes and on Year results', () => {
    const cite = Substances.Alcohol.Usage('world').Cite
    expect(cite.length).toBeGreaterThanOrEqual(1)
    expect(cite[0].source.publisher).toBe('WHO')
    const yearCite = Substances.Alcohol.Usage('us').Year(2026).Cite
    expect(yearCite.length).toBeGreaterThanOrEqual(2)
    for (const c of yearCite) expect(c.source.url).toMatch(/^https:\/\//)
  })

  it('accepts friendly spellings, any case', () => {
    expect(Substances.Alcohol.Usage('WORLD').val).toBe(2_300_000_000)
    expect(Substances.Alcohol.Usage('global').val).toBe(2_300_000_000)
    expect(Substances.Alcohol.Deaths('texas').val).toBe(13_701)
    expect(Substances.Alcohol.Deaths('usa').val).toBe(178_307)
  })

  it('throws a listing on unknown geographies', () => {
    expect(() => Substances.Alcohol.Usage('mars')).toThrow(/Unknown geography 'mars'/)
    expect(() => Substances.Alcohol.Usage('mars')).toThrow(/'world'/)
  })

  it('prefers the default dataset but keeps the rest reachable via metric', () => {
    expect(Substances.Alcohol.Usage.Year(2026).metricId).toBe('usage.alcohol.us.past_year_users')
    const pastMonth = Substances.Alcohol.Usage.Year(2024, { metric: 'past_month_use' })
    expect(pastMonth.val).toBe(46.6)
    expect(pastMonth.metricId).toBe('usage.alcohol.us.past_month')
  })
})

describe('Nicotine family', () => {
  it('serves the class measure and the seeded variants', () => {
    expect(Substances.Nicotine.Usage.Year(2023).val).toBe(58_100_000)
    expect(Substances.Nicotine.Cigarettes.Usage.Year(2022).val).toBe(28_800_000)
    expect(Substances.Nicotine.Vapes.Usage.Year(2023).val).toBe(23_500_000)
  })

  it('reports the smoking-attributable death estimate as modelled', () => {
    const deaths = Substances.Nicotine.Deaths('us')
    expect(deaths.val).toBe(480_000)
    expect(deaths.basis).toBe('modelled')
    expect(deaths.period).toMatch(/Surgeon General/)
  })

  it('resolves every product selector and shorthand', () => {
    expect(Substances.Nicotine()).toBe(Substances.Nicotine.Cigarettes)
    expect(Substances.Nicotine('cigs')).toBe(Substances.Nicotine.Cigarettes)
    expect(Substances.Nicotine('e-cig')).toBe(Substances.Nicotine.Vapes)
    expect(Substances.Nicotine('vaping')).toBe(Substances.Nicotine.Vapes)
    expect(Substances.Nicotine('zyn')).toBe(Substances.Nicotine.Pouches)
    expect(Substances.Nicotine('nicorettes')).toBe(Substances.Nicotine.Gum)
    expect(Substances.Nicotine('patches')).toBe(Substances.Nicotine.Patches)
    expect(Substances.Nicotine('cigars')).toBe(Substances.Nicotine.Cigars)
    expect(Substances.Nicotine('rolling tobacco')).toBe(Substances.Nicotine.RollingTobacco)
    expect(Substances.Tobacco('ryo')).toBe(Substances.Nicotine.RollingTobacco)
    expect(Substances.Nicotine('all')).toHaveLength(7)
    expect(() => Substances.Nicotine('hookah')).toThrow(/Unknown Nicotine selector/)
  })
})

describe('standard selector (every substance node is callable)', () => {
  it('() resolves the default sub-form, or the node itself when there is none', () => {
    expect(Substances.Cocaine()).toBe(Substances.Cocaine.Powder)
    expect(Substances.Marijuana()).toBe(Substances.Marijuana)
    expect(Substances.Heroin()).toBe(Substances.Heroin)
    expect(Substances.Psychedelics()).toBe(Substances.Psychedelics)
  })

  it('resolves variant names and shorthands, case-insensitively', () => {
    expect(Substances.Cocaine('powder')).toBe(Substances.Cocaine.Powder)
    expect(Substances.Cocaine('p')).toBe(Substances.Cocaine.Powder)
    expect(Substances.Cocaine('CRACK')).toBe(Substances.Cocaine.Crack)
    expect(Substances.Cocaine(' c ')).toBe(Substances.Cocaine.Crack)
    expect(Substances.Psychedelics('lsd')).toBe(Substances.Psychedelics.Acid)
    expect(Substances.Psychedelics('shrooms')).toBe(Substances.Psychedelics.Mushrooms)
  })

  it('resolves compounds and delta spellings on Marijuana', () => {
    expect(Substances.Marijuana('thc').key).toBe('thc')
    expect(Substances.Marijuana('CBD').key).toBe('cbd')
    expect(Substances.Marijuana('delta-8').key).toBe('delta-8')
    expect(Substances.Marijuana('8').key).toBe('delta-8')
    expect(Substances.Marijuana(9).key).toBe('delta-9')
    expect(Substances.Marijuana('d10').key).toBe('delta-10')
    expect(Substances.Marijuana('Δ9').key).toBe('delta-9')
  })

  it("derives 'all' and 'banned' lists", () => {
    const all = Substances.Marijuana('all')
    expect(all.map((c) => c.key)).toEqual(['thc', 'cbd', 'delta-8', 'delta-9', 'delta-10', 'thcp', 'thca'])
    const banned = Substances.Marijuana('banned')
    expect(banned.map((c) => c.key)).toContain('thc')
    expect(banned.map((c) => c.key)).toContain('thca')
    expect(banned.map((c) => c.key)).not.toContain('cbd')
    expect(Substances.Cocaine('all')).toHaveLength(2)
    expect(Substances.Cocaine('banned')).toEqual([])
    expect(Substances.Heroin('all')).toEqual([])
    expect(Substances.Heroin('banned')).toEqual([])
  })

  it('throws a listing of valid selectors on unknown input', () => {
    expect(() => Substances.Cocaine('speedball')).toThrow(/Unknown Cocaine selector 'speedball'/)
    expect(() => Substances.Cocaine('speedball')).toThrow(/'powder', 'p', 'crack', 'c'/)
    expect(() => Substances.Marijuana('gummy')).toThrow(/Unknown Marijuana selector/)
    expect(() => Substances.Heroin('tar')).toThrow(/Unknown Heroin selector/)
    expect(() => Substances.Heroin(8)).toThrow(/Unknown Heroin selector/)
    expect(() => Substances.Marijuana.delta(11)).toThrow(/Known: 8, 9, 10/)
  })
})

describe('Marijuana compounds', () => {
  it('exposes thc, cbd, thca, thcp with resolved citations', () => {
    for (const key of ['thc', 'cbd', 'thca', 'thcp']) {
      const compound = Substances.Marijuana[key]
      expect(compound.key).toBe(key)
      expect(compound.name).toBeTruthy()
      expect(compound.federal_status).toBeTruthy()
      expect(compound.texas_status).toBeTruthy()
      expect(compound.citations.length).toBeGreaterThanOrEqual(2)
      for (const source of compound.citations) {
        expect(source.url).toMatch(/^https:\/\//)
      }
    }
    expect(Substances.Marijuana.thc.name).toMatch(/Tetrahydrocannabinol/)
    expect(Substances.Marijuana.cbd.psychoactive).toBe(false)
  })

  it('resolves delta isomers by number or string, and by bracket key', () => {
    expect(Substances.Marijuana.delta(9).key).toBe('delta-9')
    expect(Substances.Marijuana.delta('8').key).toBe('delta-8')
    expect(Substances.Marijuana['delta-10'].key).toBe('delta-10')
    expect(() => Substances.Marijuana.delta(11)).toThrow(/Known: 8, 9, 10/)
  })

  it('rejects loose delta spellings instead of silently parsing them', () => {
    expect(() => Substances.Marijuana.delta('8x')).toThrow(/Invalid delta isomer number/)
    expect(Substances.Marijuana.delta(' 8 ').key).toBe('delta-8')
  })

  it('is case-insensitive for compounds too', () => {
    expect(Substances.Marijuana.THC.key).toBe('thc')
    expect(Substances.marijuana.ThCa.key).toBe('thca')
  })
})

describe('normalizeGeo input hygiene', () => {
  it('tolerates padding and mixed case in geo aliases', () => {
    expect(Substances.Marijuana.Usage.Year(2023, { geo: '  texas  ' }).geo).toBe('TX')
    expect(Substances.Marijuana.Usage.Year(2023, { geo: 'TeXaS' }).geo).toBe('TX')
    expect(Substances.Marijuana.Usage.Year(2023, { geo: ' Usa ' }).geo).toBe('US')
  })
})
