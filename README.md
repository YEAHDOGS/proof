# PROOF — `@dogs/proof`

Cited substance statistics from DOGS. Every number chiseled in stone: multi-source
citations for cannabis, alcohol, and more, across the US and Texas — plus laws,
representatives, and map components. The library behind the DOGS campaign site.

```bash
npm i @dogs/proof
```

```js
import { Substances, USReps, VisualMap } from '@dogs/proof'

Substances.Marijuana.Usage.Year(2023)           // 21.8% of Americans 12+, with citations
Substances.Marijuana.Usage.Year(2023, { geo: 'TX' })
Substances.Marijuana('delta-8')                 // compound sheet: statuses + citations
Substances.Cocaine('p')                         // powder sub-form (default)
```

Works from JavaScript and TypeScript — pure ES modules with JSDoc types and
shipped `.d.ts` declarations. Zero runtime dependencies; all data is compiled
in at build time.

- **Scope & goals:** [GOALS.md](GOALS.md)
- **`Substances` API and selector grammar:** [docs/substances.md](docs/substances.md)
- **`World` baselines and representatives:** [docs/world.md](docs/world.md)

## Data coverage (M2 seed)

All eight substance families now carry at least one dataset. `cross-checked`
files have every value verified against 2+ publications; `seeded` files hold
values pending that audit (`verification` field per file, `validateDataset`
in CI).

| Family | Datasets | Status |
| --- | --- | --- |
| Usage | cannabis US+TX, alcohol US (cross-checked); cocaine, heroin, meth, hallucinogens US | seeded |
| Deaths | opioids, fentanyl, cocaine, heroin, psychostimulants, cannabis (a cited zero) US; alcohol US+TX (ARDI, modelled) | seeded |
| ER visits | cannabis, alcohol US (DAWN 2023) | seeded |
| Sales | cannabis TX (Whitney Economics 2025, modelled) | seeded |

```js
Substances.Fentanyl.Deaths.Year(2023)     // 72,776 — with citations
Substances.Marijuana.Deaths.Year(2023)    // 0 — a real, cited zero
Substances.Alcohol.Deaths.Year(2021)      // 178,307/yr, modelled, period disclosed
Substances.Marijuana.Sales.Year(2025, { geo: 'TX' })  // $5.5B retail estimate
Substances.Alcohol.Usage('world')         // 2_300_000_000 — latest year, usable as the number
Substances.Alcohol.Usage('world').Cite    // …and its receipts
World.Population('us', 'texas')           // 31_290_831 — baselines, same contract
World.Representatives('us', 'texas').Senators  // structural now; full USReps lands in M3
```

## Charts

`@dogs/proof/svelte` ships a zero-dependency SVG `Chart` component (Svelte 5
peer, optional — data-only consumers install nothing). Line, area, or grouped
bars straight from any `Series()` call, with hover crosshair + tooltip,
keyboard navigation, a screen-reader data table, and theming purely through
CSS custom properties (`--proof-chart-*`, `--proof-series-1..6`). The default
series order is CVD-validated on the dark surface. `npm run dev` serves the
documentation site with live examples of all of it.

```svelte
<script>
  import { Substances } from '@dogs/proof'
  import { Chart } from '@dogs/proof/svelte'
</script>

<Chart
  title="US overdose deaths"
  series={[{ label: 'Fentanyl', points: Substances.Fentanyl.Deaths.Series() }]}
/>
```

## Stack

Vite · Svelte 5 (docs site + chart components) · TailwindCSS · SCSS ·
JavaScript with JSDoc types · Vitest + JSDOM + Testing Library

## Development

```bash
npm i
npm run dev        # documentation site (live examples + charts)
npm run test       # vitest
npm run build:lib  # library build + .d.ts emit
```
