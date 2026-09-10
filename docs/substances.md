# `Substances` — the fluent accessor tree

```js
import { Substances } from '@dogs/proof'

Substances.Marijuana.Usage.Year(2023)          // → 21.8% of Americans 12+, with citations
Substances.Marijuana.Usage.Year(2023, { geo: 'TX' })
Substances.Alcohol.Usage('world')              // → 2_300_000_000 (latest year), .Cite attached
Substances.Marijuana('delta-8')                // → the Delta-8 compound sheet
Substances.Cocaine('p').Deaths.Year(2024)      // → powder-cocaine deaths (when seeded)
```

Works identically from JavaScript and TypeScript — the library ships `.d.ts`
declarations generated from its JSDoc types.

## Two ways in: properties and calls

Every substance node is **both an object and a function**.

**Property access** walks the tree: `Substances.Marijuana.Usage.Year(2023)`.
It is **case-insensitive at every level** — `Substances.marijuana.usage.year(2023)`
and `Substances.MARIJUANA.Usage.Year(2023)` are the same call. Friendly
aliases resolve too: `Cannabis` and `Weed` are `Marijuana`; `Psychadelics`
(the common misspelling) is `Psychedelics`; `LSD` is `Acid`; `Shrooms` and
`Psilocybin` are `Mushrooms`.

**Calling** a substance node applies the **standard selector** — one grammar,
every substance:

| Call | Result |
| --- | --- |
| `Node()` | The default sub-form (`Cocaine()` → `Powder`), or the node itself when no default is defined (`Marijuana()`, `Heroin()`). |
| `Node('all')` | *Derived.* Every sub-form: compound sheets for `Marijuana`, variant nodes for `Cocaine`/`Psychedelics`, `[]` for substances with none. |
| `Node('banned')` | *Derived.* Sub-forms whose compound sheet carries `banned.texas: true` (a machine-readable "banned from Texas consumable retail as of the sheet's snapshot" flag). `[]` where no flags exist — note this speaks to sub-forms, not the substance itself. |
| `Node('<name>')` | A named sub-form. Case-insensitive, whitespace-trimmed, with shorthands. |
| `Node(8)` / `Node('8')` | Delta isomers, where compounds exist. |
| anything else | Throws, listing every valid selector for that substance. |

### Selector spellings per substance

- **Marijuana** — compounds: `'thc'`, `'cbd'`, `'thca'`, `'thcp'`; deltas as
  `8`, `'8'`, `'d8'`, `'delta-8'`, `'delta 8'`, `'Δ8'` (8, 9, or 10); plus
  `'all'` / `'banned'`. Also `Substances.Marijuana.delta(9)` and direct keys
  like `Substances.Marijuana['delta-8']` or `.thc`.
- **Cocaine** — `'powder'` / `'p'`, `'crack'` / `'c'`. Default: powder.
- **Nicotine** (alias: `Tobacco`) — `'cigarette(s)'` / `'cig(s)'` (default),
  `'vape(s)'` / `'vaping'` / `'e-cig(s)'` / `'e-cigarette(s)'`,
  `'pouch(es)'` / `'zyn'`, `'gum'` / `'nicorette(s)'`, `'patch(es)'`,
  `'cigar(s)'`, `'rolling tobacco'` / `'roll-your-own'` / `'ryo'`.
- **Psychedelics** — `'mushrooms'` / `'shrooms'` / `'psilocybin'`,
  `'acid'` / `'lsd'`, `'dmt'`, `'salvia'`.
- **Heroin, Alcohol, Fentanyl, Opioids, Amphetamines** — no sub-forms yet:
  `()` returns the node, `'all'`/`'banned'` return `[]`, anything else throws.

## Metric families

Each substance (and each variant sub-form) exposes six families:

```
.Deaths  .Usage  .Sales  .ERVisits  .Health  .Testing  .Harms
```

matching metric-file id prefixes `deaths.` `usage.` `sales.` `er_visits.`
`health.` `testing.` `harms.`. Every family has the same five methods:

| Method | Returns |
| --- | --- |
| `.Year(year, opts?)` | The observation for that year (`year` may be a number or string), as a **Stat** — the number itself, with every citation resolved. |
| `.Month(year, month, opts?)` | *Derived:* annual ÷ 12, `basis: 'derived'`, formula in `note`, source observation in `from`. |
| `.Day(year, month, day, opts?)` | *Derived:* annual ÷ 365/366. Same honesty contract. |
| `.Series(opts?)` | All observations, sorted (`order: 'asc' | 'desc'`), each a Stat. |
| `.Files(opts?)` | The raw `MetricFile` datasets behind the family. |

`opts.geo` defaults to `'US'`; pass `'TX'` for Texas. `opts.metric`
disambiguates when a family carries several measures for one geography.

### Drug-testing matrices (`.Testing` coverage)

Built from the research pass in `docs/oral-fluid-testing.md` — the
urine→oral-fluid shift Brando asked to quantify. The family carries THC
detection windows by specimen matrix plus the federal oral-fluid cutoffs:

| Dataset id | Figure | Basis |
| --- | --- | --- |
| `testing.cannabis.us.detection_window_oral_fluid` | ~72 h "up to" (chronic; ~24 h occasional) | contested |
| `testing.cannabis.us.detection_window_urine` | ~1,608 h / 67 days "up to" (chronic, EMIT 20) | contested |
| `testing.cannabis.us.detection_window_hair` | ~2,160 h / 90 days "up to" | contested |
| `testing.cannabis.us.oral_fluid_cutoff` | 4 ng/mL screen (OFMG, eff. 2020-01-01; confirm 2 ng/mL in notes) | reported |

Windows are "up to" maxima from review tables, not means — the
description says so, and the certification-lab count stays an honest
"unknown" until the primary Federal Register documents are read (see the
brief). Query like any family:
`Substances.Marijuana.Testing.Year(2026, { metric: 'detection_window_urine' })`.

### Cannabis & psychosis (`.Harms` coverage)

Built from the research pass in `docs/cannabis-psychosis.md` — the honest
quantification of cannabis's non-fatal mental-health harms Brando asked the
site to carry alongside its cited zero on cannabis overdose deaths. The
family is the deliberately adversarial dataset (§4.2 of GOALS.md): figures
that cut against the campaign, kept, with the literature's own disagreements
preserved rather than adjudicated:

| Dataset id | Figure | Basis |
| --- | --- | --- |
| `harms.cannabis.us.psychosis_risk_ever_use` | adjusted OR **1.41** vs never-use (Marconi 2016 meta-analysis) | reported |
| `harms.cannabis.us.psychosis_risk_heavy_use` | adjusted OR **2.09**, heaviest/frequent use (same meta-analysis) | reported |
| `harms.cannabis.us.psychosis_risk_high_potency_daily` | adjusted OR **~5** headline, daily high-potency use (Di Forti 2019 EU-GEI; site-specific estimates vary) | reported |
| `harms.cannabis.us.cannabis_use_disorder` | **19.7M** people 12+ (7.0%), past year (NSDUH 2023) | reported |
| `harms.cannabis.us.adolescent_iq_decline` | ~8-point Dunedin IQ decline — contested by the Rogeberg re-analysis | contested |

All psychosis datasets stay `seeded` until the ORs are re-verified against
the published tables; the brief's Honest unknowns section
(`docs/cannabis-psychosis.md`) gates every flip. Query like any family:
`Substances.Marijuana.Harms.Year(2016, { metric: 'psychosis_risk_heavy_use' })`.

### Total market sizes of the vices (market-sizes brief)

Built from the research pass in `docs/market-sizes.md` — the total-market
figures Brando asked the campaign to carry so a legislator can see how much
cash each substance's market moves. The brief graduated to a `sales.`
dataset family; modelled vs counted figures are separated by `basis`
(`modelled` for analyst/RAND/UNODC estimates, `reported` for counted state
sales/tax data). All datasets are `seeded` until the primary tables are
re-read; the per-drug splits that don't exist anywhere (heroin, fentanyl,
methamphetamine current-market) stay documented as honest unknowns in the
brief, not as datasets.

| Dataset id | Figure | Basis |
| --- | --- | --- |
| `sales.cannabis.us.retail_all_sources` | ~$52B retail spend, all sources (2016, RAND; $34B in 2006) | modelled |
| `sales.cannabis.us.retail_legal` | $30.1B legal sales (2024, Vangst/Whitney); $20B+ state tax since 2014 (NORML) | reported |
| `sales.cannabis.tx.retail` | $5.5B Texas hemp retail (2025) | modelled |
| `sales.alcohol.us.market_size` | $543B market (2024, analyst estimate); $158B consumer spend (2017, RAND) | modelled |
| `sales.nicotine.world.market_size` | $966B global tobacco (2024, analyst estimate) | modelled |
| `sales.cocaine.world.retail_market` | ~$85B retail (2009, UNODC — dated, most recent valuation) | modelled |

Query like any family:
`Substances.Marijuana.Sales.Year(2016, { metric: 'retail_spend_all_sources' })`.
Rows are not additive — the brief's
[methodology note](market-sizes.md#reading-the-numbers-honestly-methodology)
says why.

### The geo selector — families are callable

Calling a family with a geography resolves its default dataset for that geo
down to the **most recent observation**, with the family accessors
re-attached and the geo pinned:

```js
Substances.Alcohol.Usage('world')             // latest world observation (a Stat)
Substances.Alcohol.Usage('world').Cite        // its resolved citations
Substances.Alcohol.Usage('world').Year(2026)  // a specific year, same geo
Substances.Alcohol.Usage('us').Series()       // the whole series, geo pinned
```

Accepted spellings (any case): `'us'`, `'usa'`, `'america'` → US; `'tx'`,
`'texas'` → TX; `'world'`, `'global'`, `'earth'` → WORLD. Anything else
throws the list. `Usage()` with no argument scopes to the US default.

### Stats: the number IS the object

Everything `.Year()`, `.Series()`, and the geo selector return is a **Stat** —
a `Number` subclass. Used as a value it is the value
(`Usage('world') / 1e9` → `2.3`; comparisons work); as an object it carries
`year`, `val`, `basis`, `period`, `unit`, `metricId`, `geo`, `citations`,
and **`.Cite`** — the resolved citation list. (Strict `===` against a bare
literal fails, as with any object; use `.val` or `+stat` when you need the
primitive.)

### Default datasets

When several datasets share one (substance, family, geo), the YAML file
marked `default: true` answers unqualified queries; the others stay
reachable via `opts.metric`. Alcohol usage resolves to the standardized
past-year **persons count**; the past-month prevalence remains at
`{ metric: 'past_month_use' }`.

### Honest derivation, or a loud refusal

Sub-annual values are **arithmetic, not data** — and only arithmetic that is
valid. A count (deaths, ER visits, dollars) divides across months and days;
the result is flagged `basis: 'derived'` and carries its formula. A
**prevalence percentage cannot be divided** — "21.8% used this year" does not
mean "1.8% used in March" — so `.Month`/`.Day` on percent units throw and say
why. When a real monthly series lands in the data, `.Month` will serve it
directly instead of deriving.

### Errors are coverage maps

Missing data never fails silently or vaguely:

```
No PSYCHEDELICS Sales in US dataset.
Available PSYCHEDELICS datasets: usage.psychedelics.us.past_year (2023-2023).

No 1999 observation in usage.cannabis.us.past_year. Years available: 2021, 2022, 2023, 2024
```

## Compound sheets

`Substances.Marijuana('thc')` (or `.thc`) returns a `ResolvedCompound`:
name, aliases, kind, `psychoactive`, plain-English `federal_status` and
`texas_status`, machine-readable `banned` flags, and `citations` resolved
from the source catalog. Sheets live in `src/data/compounds.yaml`, carry a
file-level verification status (`seeded` until every claim is re-verified),
and follow the same citation policy as the metric files.

## Under the hood

The tree is sugar, not a second data path. It reads the same YAML datasets as
the low-level API (`getAllMetrics`, `queryMetrics`, `getMetric`,
`getCitations`, `compareClaims`, `validateDataset`), which stays exported for
anything the fluent surface doesn't cover. All data is compiled into the
bundle at build time; the library performs no runtime I/O.
