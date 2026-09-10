import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { getMetric } from './index.js'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

describe('docs', () => {
  it('ships every research brief the library docs link to', () => {
    // docs/substances.md names docs/oral-fluid-testing.md as the research
    // pass behind the .Testing family; a renamed or deleted brief must not
    // go unnoticed and leave readers hitting a dead link.
    const brief = resolve(REPO_ROOT, 'docs', 'oral-fluid-testing.md')
    expect(existsSync(brief), 'docs/oral-fluid-testing.md is missing').toBe(true)
  })

  it('carries every testing dataset the oral-fluid brief cites', () => {
    for (const id of [
      'testing.cannabis.us.detection_window_oral_fluid',
      'testing.cannabis.us.detection_window_urine',
      'testing.cannabis.us.detection_window_hair',
      'testing.cannabis.us.oral_fluid_cutoff'
    ]) {
      expect(getMetric(id), `${id} cited by the brief is missing`).toBeDefined()
    }
  })

  it('ships the cannabis-psychosis brief the library docs link to', () => {
    // docs/substances.md names docs/cannabis-psychosis.md as the research
    // pass behind the .Harms family; a renamed or deleted brief must not
    // go unnoticed and leave readers hitting a dead link.
    const brief = resolve(REPO_ROOT, 'docs', 'cannabis-psychosis.md')
    expect(existsSync(brief), 'docs/cannabis-psychosis.md is missing').toBe(true)
  })

  it('carries every harms dataset the psychosis brief cites', () => {
    for (const id of [
      'harms.cannabis.us.psychosis_risk_ever_use',
      'harms.cannabis.us.psychosis_risk_heavy_use',
      'harms.cannabis.us.psychosis_risk_high_potency_daily',
      'harms.cannabis.us.cannabis_use_disorder',
      'harms.cannabis.us.adolescent_iq_decline'
    ]) {
      expect(getMetric(id), `${id} cited by the brief is missing`).toBeDefined()
    }
  })

  it('ships the market-sizes brief the library docs link to', () => {
    // docs/substances.md names docs/market-sizes.md as the research pass
    // behind the market-size figures; a renamed or deleted brief must not
    // go unnoticed and leave readers hitting a dead link.
    const brief = resolve(REPO_ROOT, 'docs', 'market-sizes.md')
    expect(existsSync(brief), 'docs/market-sizes.md is missing').toBe(true)
  })

  it('carries every sales dataset the market-sizes brief cites', () => {
    // the brief's table graduated from docs/research to a dataset family:
    // every market-size figure the brief quotes is now a sales. dataset;
    // the per-drug splits that don't exist anywhere (heroin, fentanyl,
    // meth current-market) stay documented as honest unknowns in the brief.
    for (const id of [
      'sales.cannabis.us.retail_all_sources',
      'sales.cannabis.us.retail_legal',
      'sales.cannabis.tx.retail',
      'sales.alcohol.us.market_size',
      'sales.nicotine.world.market_size',
      'sales.cocaine.world.retail_market'
    ]) {
      expect(getMetric(id), `${id} cited by the brief is missing`).toBeDefined()
    }
  })

  it('labels every sales dataset as seeded until the primary tables are re-read', () => {
    for (const id of [
      'sales.cannabis.us.retail_all_sources',
      'sales.cannabis.us.retail_legal',
      'sales.alcohol.us.market_size',
      'sales.nicotine.world.market_size',
      'sales.cocaine.world.retail_market'
    ]) {
      expect(getMetric(id).verification, `${id} verification`).toBe('seeded')
    }
  })
})
