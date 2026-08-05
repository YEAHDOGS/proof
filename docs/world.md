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
wearedogs) lands here in **M3** and will fill the `members` arrays without
changing the API shape.
