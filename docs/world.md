# `World` — baseline statistics & representatives

```js
import { World } from '@dogs/proof'

World.Population()                        // → 8_230_000_000 (most recent year), .Cite attached
World.Population('us')                    // → US population
World.Population('us', 'texas')           // → Texas population
World.Population('us', 'texas').Year(2023)
World.Representatives('us', 'texas').Senators
```

The `World` tree holds the baselines everything else is measured against —
population now, more baseline families as they're needed — plus the
representatives namespace, the future home of the full USReps dataset.

## Places

Place paths are **hierarchical, narrowing left to right**, friendly-spelled,
and case-insensitive: `('us', 'texas')`, `('texas')`, `('USA')`, `('global')`
all resolve. No argument means the whole world. Unknown places throw the
valid list.

## Population

`World.Population(...place)` resolves to the **most recent observation** as a
Stat — usable directly as its numeric value, `.Cite` for the receipts — with
`.Year(y)`, `.Series()`, and `.Files()` attached and the place pinned.
Baselines are annual: `.Month`/`.Day` refuse rather than derive, because a
population is a level, not a flow.

Baseline datasets live beside the substance metric files
(`src/data/population/*.yaml`), carry no `substance` field, and follow the
same citation policy — every value cited, vintages and periods disclosed
(`period` distinguishes a July 1 vintage estimate from a Jan 1 projection).

Baselines exist to make shares honest:

```js
;(Substances.Alcohol.Usage('us') / World.Population('us')) * 100 // → 52.4 (%)
```

## Representatives

`World.Representatives(...place)` returns the legislature baseline for a
place: `.Senators`, `.House`, and for states `.StateSenate` / `.StateHouse`
(each `{ seats, members?, note? }`), plus `.Cite`. Today this is structural —
chamber sizes and the Texas federal senators. The full lawmaker dataset (184
records with districts, THC stances, and 1,326 citations, migrating from
the campaign app) lands here in **M3** and will fill the `members` arrays without
changing the API shape.

## WorldMap component

`@dogs/proof/svelte` ships a zero-dependency `WorldMap` choropleth (Svelte 5
peer, optional) — the shared DOGS world geometry, shaded by a 7-step log
ramp. `metricToMapCountries` turns any metric file's latest observation into
the component's country array, resolving the file's geo through the same
normalization the `World` tree uses:

```svelte
<script>
  import { getMetric, metricToMapCountries } from '@dogs/proof'
  import { WorldMap } from '@dogs/proof/svelte'
  let selected = $state(null)
</script>

<WorldMap
  countries={metricToMapCountries(getMetric('deaths.alcohol.us.excess'))}
  {selected}
  onSelect={(code) => (selected = code)}
/>
```

Only national geos resolve to a country polygon (`US` → `us`). `TX` is
subnational and `WORLD` is an aggregate — both honestly yield no countries
rather than being fudged onto a shape, and files with no mappable geography
return `[]`, never throw. Theming is purely CSS custom properties
(`--map-1..7`, `--map-empty`, `--map-stroke`, …) with built-in dark defaults;
every value is also in a screen-reader list, so nothing is hover-only.

## Deaths today (labeled estimates)

`deathsPerDay(metricFile)` and `deathsToday(metricFile, now?)` prorate a
dataset's latest **annual** death count across the year and the current local
day. They apply only to annual death units (`deaths`, `deaths_per_year`) and
return `null` for everything else. Every result carries `basis: 'estimated'`
and a note spelling out the proration — the number is arithmetic on a cited
annual figure, and it says so; it is never a measured count.

```js
import { getMetric, deathsPerDay } from '@dogs/proof'

deathsPerDay(getMetric('deaths.alcohol.us.excess'))
// → { val: 488.5, year: 2021, unit: 'deaths_per_day', basis: 'estimated',
//     note: 'Prorated estimate, not a measured count: Annual figure 178,307 (2021) / 365.', … }
```
