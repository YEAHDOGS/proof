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
})
