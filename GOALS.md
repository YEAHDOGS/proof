# PROOF (`@dogs/proof`) — Project Goals & Scope

The one-line pitch: **install one tiny package, get every chiseled-in-stone stat, law,
representative, and map the DOGS THC campaign runs on.**

Package: **`@dogs/proof`**

```bash
npm i @dogs/proof
```

```js
import { Substances, USReps, VisualMap } from '@dogs/proof'
```

This document is the scope contract. Everything in [stats/notes.md](stats/notes.md) is
represented here, plus the full data surface of the DOGS campaign app (which will
eventually delete its local data and import this library instead).

---

## 1. Packaging goals

| Goal | Decision |
| --- | --- |
| Install name | **`@dogs/proof`** (decided Aug 2026; bare `proof` on npm is taken (an old assertion library), the scope sidesteps it — register the `dogs` npm org before first publish). |
| Runtime dependencies | **Zero.** All data is compiled into the bundle at build time (YAML → JS via vite plugin). No fetch, no fs, no runtime YAML parser. |
| Peer dependencies | `svelte >= 5` (optional; needed for any `./svelte` component). `maplibre-gl` + `svelte-maplibre-gl` (optional; needed only for the GL renderer — the classic SVG renderer runs on `svelte` alone). Data-only consumers install nothing extra. |
| JS + TS support | Source stays JSDoc-typed ES modules; `tsc --emitDeclarationOnly` ships `.d.ts` next to every export. TS users get full types and autocomplete; JS users get the same via editor JSDoc inference. |
| Subpath exports | `.` → data API (Substances, USReps, Laws, Timeline, Media, sources/citations helpers). `./svelte` → VisualMap components (raw `.svelte` files, compiled by the consumer's bundler — the standard Svelte-library pattern, via `svelte` field + `svelte-package`). |
| Tree-shaking | `sideEffects: false` stays; per-substance data modules so `import { Substances }` doesn't force map geometry into a non-map bundle. |

## 2. Public API surface

### 2.1 `Substances`

Fluent, case-insensitive accessor tree over the metric files. Both `Substances.Cocaine`
and `Substances.cocaine` resolve; string indexing (`Substances['delta-8']` under
marijuana) works for hyphenated names.

**Standard selector (Aug 2026):** every substance node is also callable with one
uniform grammar — `Node()` resolves the default sub-form (`Cocaine()` → powder) or the
node itself; `Node('all')` and `Node('banned')` are derived lists; named selectors with
shorthands (`Cocaine('p')`, `Marijuana('delta-8' | '8' | 'thc')`); unknown selectors
throw listing valid ones. Full grammar documented in [docs/substances.md](docs/substances.md).

```js
Substances.Cocaine.Deaths.Year(2026)      // number or string year accepted
Substances.Cocaine.Deaths.Year('2026')
Substances.Cocaine.Deaths.Month(2026, 3)  // derived: annual ÷ 12 unless a real monthly series exists
Substances.Cocaine.Deaths.Day(2026, 3, 14)// derived: annual ÷ 365/366 unless real daily data exists
Substances.Marijuana.thc                  // canonical compound info
Substances.Marijuana.delta(9)             // delta-8 / delta-9 / delta-10
Substances.Marijuana.cbd
Substances.Marijuana.thcp
Substances.Marijuana.thca
```

Every leaf value returns the observation **with its citations attached** — the number is
never separated from its receipts. Derived values are flagged `basis: 'derived'` with the
derivation formula in `note`.

**Standardization decisions (Aug 2026):**

- **Geo selector**: metric families are callable — `Usage('world' | 'us' | 'texas')`
  resolves the default dataset for that geo to its **most recent observation**, with
  `.Year/.Series/...` re-attached and the geo pinned.
- **Stats are Numbers**: every resolved observation is a `Number` subclass — usable
  directly as its value — carrying its fields plus **`.Cite`** (resolved citations).
- **Standard Usage measure is a persons count** (`past_year_users`), so substances and
  geographies compare directly; prevalence percentages stay as secondary metrics.
- **`default: true`** on a YAML file marks which dataset answers unqualified queries
  when several share a (substance, family, geo); the rest stay reachable via `metric`.
- **Observations carry no `src` field** — the citations array is the single record of
  sourcing (first entry = primary by convention).
- **YAML numbers ≥ 1,000 use `_` separators** (`2_300_000_000`), parsed natively by
  js-yaml.

**Substance catalog** (each with variants):

- **Marijuana** — THC, CBD, Delta-8, Delta-9, Delta-10, THCP, THCA
- **Cocaine** — crack, powder
- **Heroin**
- **Alcohol**
- **Nicotine** (added Aug 2026; alias Tobacco) — cigarettes, vapes/e-cigs,
  pouches, gum (Nicorette), patches, cigars, rolling tobacco
- **Fentanyl**
- **Opioids** (class-level; fentanyl also rolls up here)
- **Amphetamines**
- **Psychedelics** — Mushrooms (psilocybin), Acid (LSD), DMT, Salvia

**Metric families** (per substance, where data exists):

| Family | Accessor | Grain |
| --- | --- | --- |
| Deaths | `.Deaths` | year (reported) → month/day (derived) |
| Sales / profit | `.Sales` | year; market size, tax revenue where states report it |
| Consuming population | `.Usage` | year; past-month/past-year prevalence + absolute counts |
| ER visits | `.ERVisits` | year (DAWN / HCUP) → month/day (derived) |
| Laws | `.Laws` | federal + Texas status, penalties, scheduling |
| Compounds (marijuana only) | `.thc/.cbd/.delta(n)/...` | chemistry, legality class, potency notes |

**Geography grain:** `US` (federal/national) and `TX` now; city slugs (`TX-AUSTIN`,
`TX-HOUSTON`, `TX-DALLAS`, `TX-SANANTONIO`, `TX-ELPASO`, `TX-CORPUS`, `TX-GALVESTON`,
`TX-WACO`) reserved in the schema and filled as sources allow.

### 2.2 `USReps` → `World.Representatives` (direction change Aug 2026)

Representative data lives under the global `World` namespace —
`World.Representatives('us', 'texas').Senators` — alongside baseline stats:
`World.Population()` / `('us')` / `('us', 'texas')`, most recent year by
default, `.Year(y)` selectable, Stat + `.Cite` contract identical to
Substances. Baseline population datasets (world/US/TX, Census + UN WPP) and
the structural representatives file shipped Aug 2026; the record shape below
is the M3 target that fills `members`.

```js
USReps('Vikki Goodwin')        // callable shorthand
USReps.Reps('Vikki Goodwin')   // same thing, explicit
USReps.Reps()                  // all tracked reps
USReps.District('TX-HD-47')    // lookup by district
USReps.Senate() / USReps.House()  // federal + Texas chambers, filterable
```

Record shape per representative (federal + Texas state, House and Senate):

- name, chamber, district, party affiliation
- **viewpoint on THC** (stance grading with citations — votes, statements, bill sponsorships)
- influence (committee seats, leadership roles)
- biography, photo/media pointers
- contact info
- legislation history relevant to THC (bills authored/sponsored/voted)

### 2.3 `Laws` (also reachable via `Substances.X.Laws`)

- Federal scheduling + statutes per substance
- Texas statutes, penalty groups, possession thresholds
- 2018 Farm Bill lineage: why Delta-8/THCA exist commercially
- Drug-testing & hireability law, federal and Texas
- Oversight/health/safety regulations (federal / state / city)
- **Timeline** of Texas THC legislative history — notable events, bill lifecycles
  (absorbs the campaign app `hempTimeline`)

### 2.4 `VisualMap` (Svelte 5, `@dogs/proof/svelte`)

```svelte
<VisualMap.Texas />
<VisualMap.USA />
<VisualMap.World />
```

**Direction change (Aug 2026): real cartography, not hand-rolled SVG.** The campaign app's
SVG maps have no roads, no buildings, no street-level detail. VisualMap is instead
built on a proper WebGL map engine:

- **Engine: [MapLibre GL JS](https://maplibre.org/projects/gl-js/)** (open-source
  Mapbox GL fork, BSD, no API key, no billing). Gives us vector-tile streets down to
  building level, **3D building extrusion** (`fill-extrusion`), camera tilt/rotate,
  globe view, 3D terrain, WebGL (WebGPU coming). This is the one heavyweight
  dependency the library accepts — and only behind the `./svelte` subpath as an
  optional peer, so the data API stays zero-dep.
- **Tiles: no-key defaults, self-host option.** Default style points at
  [OpenFreeMap](https://github.com/hyperknot/openfreemap) (free hosted OSM vector
  tiles — no registration, no API keys, no limits). Alternative for full control:
  [Protomaps](https://protomaps.com/about) PMTiles single-file extract (a Texas
  extract) hosted on Cloudflare R2, matching the existing DOGS
  R2 data-bucket pattern with free egress. Consumers can pass their own
  `style`/`tiles` prop to override either.
- **Wrapper: [svelte-maplibre-gl](https://github.com/MIERUNE/svelte-maplibre-gl)**
  (decided Aug 2026). Declarative Svelte 5 components over MapLibre GL JS; its
  [3D-buildings example](https://svelte-maplibre-gl.mierune.dev/examples/3d-buildings)
  proves the extrusion path. Lean on maplibre-gl-js + svelte-maplibre-gl for as
  much as possible — camera, layers, popups, controls — rather than reinventing.
- **Dual renderer — the zero-dep classic maps stay.** Every VisualMap component
  offers both engines:
  - `renderer="classic"` — the campaign app's hand-rolled SVG maps ported verbatim
    (Texas outline, Voronoi cells, spring zoom, pins, the whole current look).
    Zero dependencies beyond `svelte`. **Drop-in parity contract: the campaign app must
    be able to replace its `TexasLawmakerMap` / `WorldMap` with these and get the
    exact same experience.**
  - `renderer="gl"` — the MapLibre engine: real streets, 3D buildings, tilt,
    street-level zoom.
  Same props, same events, same campaign layers on both; the renderer prop (or
  paired exports, decided at M5 design time) is the only difference.
- **Campaign layers ride on top of either renderer**: lawmaker pins
  (chamber/party/stance styling ported from `TexasLawmakerMap`), store-density
  dots, city labels/tiers, neighbor-state legal-status tint, metric choropleths
  bound to any library dataset. "See people" = population/usage density via
  MapLibre's native heatmap/circle layers (no deck.gl unless a layer genuinely
  exceeds what MapLibre can do).
- **Feature parity contract with the campaign app stays**: props equivalent to today's
  `TexasLawmakerMap` (lawmakers, selectedEmails, focusRequest, saleMode, copMode,
  initialStatsTab, fullscreen), layer toggles, zoom-to-lawmaker, the 4-tab stats
  sheet data hooks. `World` keeps country-level choropleth ability; `USA` gets
  state-level choropleth. All three are the same engine with different starting
  cameras/bounds and layer presets.
- **Browser targets**: all modern phones (mobile-first), tablets, and desktops —
  responsive design throughout. The Potato Target does not apply to the GL
  renderer; the classic SVG renderer remains the lightweight path.
- **Design base: the campaign app's current `/stats/representation` styling**
  (the Texas map stats sheet). Tokens extracted from the live app to carry over,
  including into a custom dark MapLibre basemap style:
  - near-black app background `#050508` (stone darks `#0c0a09`/`#1c1917` for
    inverted chips), translucent dark cards `rgba(15,15,22,.45)`, hairline
    borders `rgba(255,255,255,.05)`
  - `ui-monospace` for all stats UI; Inter/Outfit for site text
  - semantic accents (Tailwind hues): **amber** `#fbbf24`/`#fde68a` = active
    tab/highlight, **emerald** `#10b981`/`#34d399` = pro/legal/"reported",
    **red** `#dc2626`/`#f87171` = anti/ban, **blue** `#2563eb`/`#60a5fa` =
    Dem/medical, pink→purple gradient bars for Texas figures, zinc greys neutral
  - `basis` badge palette (reported=emerald, derived=blue, modelled=amber,
    contested=red, none=zinc) and the 0–5 stance score chip scale
    (`s0` zinc → `s1` emerald … `s5` red)

### 2.5 `Chart` (Svelte 5, `@dogs/proof/svelte`) — shipped Aug 2026

Zero-dependency, styleable SVG graphs for any library series (requested Aug
2026: "visible styleable graph diagrams"). Line / area / grouped-bar, plots
`Series()` output directly, hover crosshair + tooltip, keyboard navigation,
screen-reader data table, theming via CSS custom properties only
(`--proof-chart-*`, `--proof-series-1..6`; default series order
CVD-validated on the dark surface). Lives beside the future VisualMap under
the `./svelte` subpath (svelte peer optional). The `npm run dev` docs site
demos it live.

### 2.6 Cross-cutting stats API (already built, kept)

`getAllMetrics / queryMetrics / getMetric / getSortedPoints / getCitations /
compareClaims / validateDataset / getAllSources / getSource` — the fluent `Substances`
tree is sugar over this layer, not a replacement.

## 3. Coverage checklist from stats/notes.md

Every line item from the notes, mapped to where it lands:

- [ ] **SAMHSA / NSDUH datasets** → `Substances.*.Usage` (source catalog already seeded)
- [ ] **Monitoring the Future (school-age)** → `Substances.*.Usage` youth series
- [ ] **Nationwide / State / City grain** → `geo` axis: `US`, `TX`, `TX-*` city slugs
      (Dallas–Fort Worth, Houston, Austin, San Antonio, Galveston, El Paso, Corpus
      Christi, Waco)
- [ ] **Yearly / monthly / daily (sometimes hourly)** → `.Year/.Month/.Day` accessors;
      sub-annual is `derived` unless a real series exists
- [ ] **Media stats** — mass-media articles for/against THC → `Media` namespace:
      article counts, outlet, stance coding, with citations
- [ ] **Rep bios, pictures, videos, media** → `USReps` record shape (§2.2)
- [ ] **How much money is involved** → `Substances.*.Sales`: THC store counts
      (America / Texas / per major city), market size, revenue
- [ ] **How healthy/unhealthy is marijuana** → `Substances.Marijuana.Health`:
      hospitalization rates (federal/state/city), mental-health patients listing
      marijuana use, citeable studies catalog. Classification-vs-risk comparison
      (does Delta-8 vs Delta-9 change hospitalization rates?)
- [ ] **Legislation timeline of THC Texas history** → `Laws.Timeline`
- [ ] **Drug testing & hireability laws** → `Laws.Employment`
- [ ] **THC brands + classifications since 2018** → `Substances.Marijuana.Brands`:
      brands, producers, compound classifications
- [ ] **Current oversight/health/safety regulations** → `Laws.Regulations`
      (federal / state / city)
- [ ] **Representation stats** → `USReps`: federal + state + city/district, senators
      and house, party, THC viewpoint, influence, biographies, legislation histories

## 4. Campaign-app parity (migration contract)

The library must cover **all data currently present in the campaign app**, so it
can delete its local copies and `npm i @dogs/proof`. Inventory:

### 4.1 Data modules to absorb (all in the campaign app's `src/lib/` unless noted)

| Source | Contents | Lands in |
| --- | --- | --- |
| `hempStats.js` | `TEXAS_STATS` (Whitney Economics 2025: $5.5B retail, $268M tax, $10.3B impact, 53.3k jobs, 8,500+ businesses, 7,500+ retailers), `NEIGHBOR_STATS` (NM/OK/AR/LA/MX legal status + revenue + tax rates, mixed CY/FY periods), `CITY_STATS` (5 metros, modelled population-share splits), `STATS_SOURCES` | `Substances.Marijuana.Sales` |
| `hempHealth.js` | `DEATH_STATS` (alcohol US 178,307 & TX 13,701; TX all-overdose 4,980 in 2024; cannabis overdose 0), `ED_STATS` (alcohol ED 5.37M; cannabis ED 896,418 in 2023), `ED_SHARE`, `HEALTH_TAKEAWAYS`, `HEALTH_RESEARCH` (10 primary-source links), `HEALTH_METHOD` | `Substances.*.Deaths` / `.ERVisits` / `.Health` |
| `hempTimeline.js` | `WHY_TIMELINE` (19 events, 1937 → Nov 12 2026, federal + Texas + Austin + courts), `WHY_GUMMY_STEPS` (5 statute anchors: Tex. HSC §481.121/.103/.116/.002(49)), `WHY_PLAYERS` (10 named actors with stance) | `Laws.Timeline`, `Laws` statutes |
| `hempStores.js` | `STORE_TOTAL` (7,500), city-weighted counts, seeded-PRNG dot scatter (explicitly illustrative) | `Substances.Marijuana.Sales.Stores` (counts real, dots stay presentation-layer) |
| `texasGeo.js` | Texas outline, Rio Grande, 5 neighbor polygons, 13 highways, 6 rivers, 217 cities (tiered), 16 landmarks, water labels, Voronoi city cells, equirectangular projection helpers | `VisualMap.Texas` geometry data |
| `public/data/campaigns.json` → `save-texas-hemp.lawmakers` | **184 lawmaker records** (149 House, 31 Senate, 3 federal, 1 exec; 110R/74D) with `banLikelihood` 1–5 stance scale, lat/lng, district, prose voting `record`, **1,326 citation entries**. Vikki Goodwin is present (HD-47, D, Austin, banLikelihood 1). | `USReps` |
| `public/fundraiser/*.md` (4 THC bios) + `contactReps` letter bodies + `public/correspondence/` (Cornyn exchange) | Dense inline stats: NHTSA impaired-driving deaths (12,429 US / 1,699 TX, 2023), NSDUH 61.6M past-year users, CUD 20.6M vs AUD 27.9M, illicit-vape contamination study, penalty schedule, polling | Each factual claim becomes a cited observation; prose stays in the campaign app but reads numbers from the library |

### 4.2 Conventions to preserve (they're load-bearing in the app)

- `basis` vocabulary — the campaign app uses **five** grades: `reported / derived / modelled / contested` plus **`none`** ("no reliable public figure exists; say so instead of guessing" — Louisiana). Adopt `none` into our `Basis` type.
- **Paired display + numeric values** (`"$590M"` + `590_000_000`); `null` = don't chart, `0` = a real zero (cannabis overdose deaths).
- Mandatory `period` disclosure (calendar vs fiscal year traps: OK is FY, AR is CY; NM's "$1B" headline is cumulative-since-2022, not annual).
- `tone` semantic channels (`bad/warn/good`, `ban/legal/court/money/now`, `for/against/both`).
- `banLikelihood` 1–5 ordinal stance scale with fixed labels; absent/0 renders "NO RECORD YET", never guessed.
- Adversarial honesty: datasets deliberately include figures that cut against the campaign.

### 4.3 Findings that change the scope

- **There is no USA state map in the campaign app.** `WorldMap.svelte` is a country-level SVG choropleth (~180 ISO-2 paths); `MapPanel.svelte` is the same world SVG with city pins. So `VisualMap.USA` is net-new — moot now that all three maps are rebuilt on MapLibre (§2.4) rather than ported as SVG; the SVG components' *feature set* (choropleth, pins, zoom-to) is the parity bar, not their implementation.
- **No county or legislative-district polygons exist.** Districts are a point + prose `counties` string; city "territories" are synthetic Voronoi cells. Real district shapes are a stretch goal, not parity.
- **No lawmaker photos/bios/committee/structured votes.** The notes.md ambition (bios, pictures, videos, structured legislation history) is *new data collection*, not migration — roll-call tallies currently live as prose inside `record` strings and must be re-entered as structured, cited votes.
- **The stats have already drifted across the campaign app's four copies** (JS modules vs 4 bios vs 2 letters vs correspondence — e.g. "~5,500 overdose deaths" in one bio vs 4,980 in `hempHealth.js`; NM $1.1B vs $590M in two different files). The library becoming the single source of truth is the core value proposition of this migration.
- The campaign app also has `countryStats.js` (58 attributes × ~180 countries, incl. per-substance overdose fields) — but it is **synthetic/templated, not sourced**. It does not meet the citation policy; treat as UI-shape precedent only, not data to migrate.

**Migration rules** (standing): never modify the campaign app, never push anywhere, migration
happens *into* PROOF only, and it adopts the library only when the user says
so.

## 5. Data integrity policy (unchanged, restated)

- Every observation cites ≥1 source; target ≥2 independent publications
  ("chisel it in stone").
- **Every citation carries a direct `url`** to the exact document, page, or table
  backing the claim (Aug 2026) — never just a publisher homepage. The sources.yaml
  catalog keeps the program-level context; the citation links straight to the
  evidence. `validateDataset` enforces it.
- Citations record the value **as that source reports it** — disagreements preserved,
  surfaced by `compareClaims`.
- `basis` grading: `reported` / `derived` / `modelled` / `contested` / `none`
  (the fifth grade adopted from the campaign app: "no reliable public figure exists" —
  stated honestly instead of guessed).
- `verification`: `seeded` → `cross-checked` per file; CI runs `validateDataset` on
  every dataset.
- NSDUH gotchas honored: state figures are 2-year averages (`period` field), 2021
  multimode break means series start at 2021.

## 6. Milestones

1. **M1 — API skeleton**: `Substances` fluent tree + `.Year/.Month/.Day` over existing
   YAML; publish `@dogs/proof@0.x` to verify install/import/type experience in a JS and a
   TS consumer.
2. **M2 — Substance breadth**: seed Deaths/Usage/Sales/ERVisits files for all eight
   substance families (US + TX, `seeded` status), then cross-check pass.
   *Seed pass landed Aug 2026 (15 datasets, every family covered; deaths 2021-2023
   from NIDA/NCHS, ARDI alcohol, DAWN ER visits, Whitney TX sales). Cross-check
   pass still open — every `seeded` file needs its values verified against the
   cited publications before flipping to `cross-checked`.*
3. **M3 — USReps**: Texas legislature + Texas congressional delegation dataset, callable
   API, stance citations.
4. **M4 — Laws & Timeline**: federal + Texas law data, employment/drug-testing,
   timeline absorbed from the campaign app.
5. **M5 — VisualMap**: Texas/USA/World components behind `./svelte`, dual renderer —
   classic SVG ported from the campaign app (exact-experience drop-in) + svelte-maplibre-gl
   engine (streets/3D buildings), shared props and campaign layers, styled to the
   `/stats/representation` design base.
6. **M6 — campaign-app parity audit**: diff library coverage against the campaign-app
   inventory (§4); close gaps; campaign-app migration can then be scheduled.
7. **M7 — Media & Health deep-dives**: media stance tracking, hospitalization/mental
   health series, studies catalog.
