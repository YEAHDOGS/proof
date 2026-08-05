// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/svelte'
import Chart from './Chart.svelte'

// JSDOM has no ResizeObserver; Svelte's bind:clientWidth needs one.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const SERIES_A = {
  label: 'Fentanyl',
  points: [
    { year: 2021, val: 70601 },
    { year: 2022, val: 73838 },
    { year: 2023, val: 72776 }
  ]
}
const SERIES_B = {
  label: 'Cocaine',
  points: [
    { year: 2021, val: 24486 },
    { year: 2023, val: 29918 }
  ]
}

describe('Chart', () => {
  it('renders an accessible figure with the title', () => {
    const { container, getByRole } = render(Chart, {
      props: { title: 'Overdose deaths', series: [SERIES_A] }
    })
    expect(getByRole('img', { name: 'Overdose deaths' })).toBeTruthy()
    expect(container.querySelector('.pc-title')?.textContent).toBe('Overdose deaths')
  })

  it('shows a legend for two series, none for one', () => {
    const two = render(Chart, { props: { series: [SERIES_A, SERIES_B] } })
    const keys = [...two.container.querySelectorAll('.pc-key-label')].map((el) => el.textContent)
    expect(keys).toEqual(['Fentanyl', 'Cocaine'])

    const one = render(Chart, { props: { series: [SERIES_A] } })
    expect(one.container.querySelector('.pc-legend')).toBeNull()
  })

  it('always renders the non-hover data table, gaps as em dashes', () => {
    const { container } = render(Chart, { props: { title: 't', series: [SERIES_A, SERIES_B] } })
    const rows = [...container.querySelectorAll('.pc-sr tbody tr')]
    expect(rows.length).toBe(3) // union of years 2021-2023
    const cells2022 = [...rows[1].querySelectorAll('th,td')].map((el) => el.textContent)
    expect(cells2022).toEqual(['2022', '73838', '—']) // B has no 2022 point
  })

  it('ignores empty or missing series entries', () => {
    const { container } = render(Chart, {
      props: { series: [SERIES_A, { label: 'empty', points: [] }] }
    })
    expect(container.querySelector('.pc-legend')).toBeNull()
    expect([...container.querySelectorAll('.pc-sr thead th')].length).toBe(2)
  })
})
