// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import { tick } from 'svelte'
import WorldMap from './WorldMap.svelte'

// NOTE: jsdom resolves `#id` selectors via document.getElementById, so two
// mounted maps (duplicate SVG ids) make scoped `#us` lookups miss. Clean up
// between tests so each render owns the document.
afterEach(cleanup)

const COUNTRIES = [
  { code: 'us', name: 'United States', num: 178_000, value: '178K' },
  { code: 'ca', name: 'Canada', num: 178, value: '178' }
]

describe('WorldMap', () => {
  it('paints data countries with the has-data class and shades them on the ramp', async () => {
    const { container } = render(WorldMap, { props: { countries: COUNTRIES } })
    await tick()
    const us = container.querySelector('#us')
    const ca = container.querySelector('#ca')
    expect(us?.classList.contains('has-data')).toBe(true)
    expect(ca?.classList.contains('has-data')).toBe(true)
    expect(us?.style.getPropertyValue('--fill')).toBe('var(--map-7)') // max -> top step
    expect(ca?.style.getPropertyValue('--fill')).toBe('var(--map-1)') // min -> bottom step
    expect(container.querySelector('#mx')?.classList.contains('has-data')).toBe(false)
  })

  it('lands a single country on step 1 (degenerate min == max range)', async () => {
    const { container } = render(WorldMap, { props: { countries: [COUNTRIES[0]] } })
    await tick()
    expect(container.querySelector('#us')?.style.getPropertyValue('--fill')).toBe('var(--map-1)')
  })

  it('marks the selected country', async () => {
    const { container } = render(WorldMap, {
      props: { countries: COUNTRIES, selected: 'us' }
    })
    await tick()
    expect(container.querySelector('#us')?.classList.contains('selected')).toBe(true)
    expect(container.querySelector('#ca')?.classList.contains('selected')).toBe(false)
  })

  it('calls onSelect with the country code on click', async () => {
    const onSelect = vi.fn()
    const { container } = render(WorldMap, { props: { countries: COUNTRIES, onSelect } })
    await tick()
    await fireEvent.click(/** @type {Element} */ (container.querySelector('#us')))
    expect(onSelect).toHaveBeenCalledWith('us')
  })

  it('ignores clicks on countries with no data', async () => {
    const onSelect = vi.fn()
    const { container } = render(WorldMap, { props: { countries: COUNTRIES, onSelect } })
    await tick()
    await fireEvent.click(/** @type {Element} */ (container.querySelector('#mx')))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('shows a tooltip with name and value on hover', async () => {
    const { container } = render(WorldMap, { props: { countries: COUNTRIES } })
    await tick()
    await fireEvent.mouseMove(/** @type {Element} */ (container.querySelector('#us')), {
      clientX: 10,
      clientY: 10
    })
    await tick()
    const tip = container.querySelector('.pm-tip')
    expect(tip?.textContent).toContain('United States')
    expect(tip?.textContent).toContain('178K')
  })

  it('renders the 7-step legend and the screen-reader value list', () => {
    const { container } = render(WorldMap, { props: { countries: COUNTRIES } })
    expect(container.querySelectorAll('.pm-swatch').length).toBe(7)
    const sr = container.querySelector('.pm-sr')
    expect(sr?.textContent).toContain('United States: 178K')
    expect(sr?.textContent).toContain('Canada: 178')
  })

  it('renders empty gracefully with no countries', () => {
    const { container } = render(WorldMap, { props: {} })
    expect(container.querySelector('svg')).toBeTruthy()
    expect(container.querySelectorAll('.pm-swatch').length).toBe(7)
  })
})
