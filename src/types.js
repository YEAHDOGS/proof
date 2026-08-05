/**
 * @file Core type definitions for the PROOF (@dogs/proof) library.
 *
 * The schema is SDMX-inspired: datasets are "metric files" keyed by
 * (substance, geo, metric, unit), holding a time series of observations.
 *
 * Citation policy ("chisel it in stone"):
 *   - Every observation MUST cite at least one source anchor, and SHOULD cite
 *     two or more independent publications so values can be cross-compared.
 *   - Each citation records the value AS REPORTED BY THAT SOURCE, so
 *     disagreements between publications are preserved, not averaged away.
 *   - Anchors resolve against the central catalog in `src/data/sources.yaml`.
 */

/**
 * Substance tracked by a dataset (canonical uppercase codes).
 * The fluent `Substances` tree maps friendly names onto these
 * (Marijuana -> CANNABIS, Acid -> PSYCHEDELICS + variant 'lsd', ...).
 * @typedef {'CANNABIS' | 'ALCOHOL' | 'NICOTINE' | 'COCAINE' | 'HEROIN' | 'FENTANYL' | 'OPIOIDS' | 'AMPHETAMINES' | 'PSYCHEDELICS'} Substance
 */

/**
 * Sub-form of a substance, when a dataset covers one form specifically
 * rather than the whole class (crack vs powder cocaine, mushrooms vs LSD,
 * cigarettes vs vapes).
 * @typedef {'crack' | 'powder' | 'mushrooms' | 'lsd' | 'dmt' | 'salvia'
 *   | 'cigarette' | 'vape' | 'pouch' | 'gum' | 'patch' | 'cigar' | 'rolling_tobacco'} Variant
 */

/**
 * Geographic scope of a dataset. Two-letter USPS code for states,
 * 'US' for national, 'WORLD' for global estimates, city slugs
 * (e.g. 'TX-AUSTIN') reserved for later. The fluent tree also accepts
 * friendly spellings ('world', 'texas', 'usa') via its geo selector.
 * @typedef {'US' | 'TX' | 'WORLD'} Geo
 */

/**
 * Dataset verification status.
 *   - 'seeded'        values entered from memory/notes; NOT yet citation-checked.
 *   - 'cross-checked' every observation verified against at least two sources.
 * @typedef {'seeded' | 'cross-checked'} VerificationStatus
 */

/**
 * A single source's claim about an observation's value.
 * Multiple citations per observation let consumers compare what different
 * publications report for the same (metric, year).
 * @typedef {Object} Citation
 * @property {string} src        Anchor key into the sources catalog (sources.yaml).
 * @property {string} url        Direct URL to the exact document, page, or table
 *                               backing this claim — every citation links straight
 *                               to its evidence, never just a publisher homepage.
 *                               (The catalog entry's url is the program page.)
 * @property {number} [val]      The value as reported by this source, in the
 *                               dataset's `unit`. Omit when the source confirms
 *                               the observation without restating the number.
 * @property {string} [locator]  Where inside the source the number appears
 *                               (table id, page, figure), e.g. 'Table 1.29B'.
 * @property {string} [quote]    Short verbatim excerpt backing the value.
 * @property {string} [note]     Free-form caveat (methodology change, rounding).
 */

/**
 * How much weight a figure holds (adopted from the wearedogs stats convention):
 *   - 'reported'  published as-is by an agency or named study.
 *   - 'derived'   arithmetic on reported figures; inputs must be cited.
 *   - 'modelled'  an estimate with no per-item source.
 *   - 'contested' sources materially disagree; see citations for the spread.
 *   - 'none'      no reliable public figure exists; said honestly instead of guessed.
 * @typedef {'reported' | 'derived' | 'modelled' | 'contested' | 'none'} Basis
 */

/**
 * One time-series observation. The citations array is the single record of
 * sourcing — its first entry is the primary source by convention.
 * @typedef {Object} DataPoint
 * @property {number} year            Calendar/survey year of the observation.
 * @property {number} val             Primary value, expressed in the dataset's `unit`.
 * @property {number} [pct]           Optional percentage companion when `val`
 *                                    is an absolute count (e.g. millions of people).
 * @property {Citation[]} citations   All source claims for this observation.
 * @property {Basis} [basis]          Weight of the figure; defaults to 'reported'.
 * @property {string} [period]        Exact period covered when it is not a plain
 *                                    calendar year, e.g. 'FY2025' or
 *                                    '2022-2023 annual average'. Prevents
 *                                    fiscal-vs-calendar and average-vs-single-year mixups.
 */

/**
 * An entry in the central source catalog (sources.yaml).
 * @typedef {Object} SourceCitation
 * @property {string} name           Full publication/program name.
 * @property {string} publisher      Issuing organization (SAMHSA, NHTSA, ...).
 * @property {string} url            Canonical URL of the publication or program page.
 * @property {string} [data_tool]    Interactive data explorer URL, if any.
 * @property {number} [year]         Publication year, for dated reports.
 * @property {string} [note]         Scope or methodology remark.
 */

/**
 * A whole YAML dataset file under src/data/.
 * @typedef {Object} MetricFile
 * @property {string} id                        Stable dotted identifier, e.g. 'usage.cannabis.us.past_year'.
 *                                              The first dotted segment is the metric family
 *                                              ('usage', 'deaths', 'sales', 'er_visits', 'health') or a
 *                                              baseline family ('population').
 * @property {Substance} [substance]            Absent on baseline (non-substance) datasets
 *                                              such as population.
 * @property {Variant} [variant]                Set when the dataset covers one sub-form only.
 * @property {Geo} geo
 * @property {string} metric                    Machine-readable measure name, e.g. 'past_year_use'.
 * @property {string} unit                      Unit of `val`, e.g. 'percent_population_12_plus'.
 * @property {string} title                     Human-readable title.
 * @property {string} [description]             Methodology notes and caveats.
 * @property {VerificationStatus} verification  Citation-audit status of the whole file.
 * @property {boolean} [default]                When several datasets share one
 *                                              (substance, family, geo), the one marked
 *                                              default answers unqualified queries; the
 *                                              rest stay reachable via { metric }.
 * @property {DataPoint[]} observations         The time series.
 */

/**
 * A citation with its anchor resolved against the source catalog.
 * @typedef {Citation & { source: SourceCitation }} ResolvedCitation
 */

/**
 * A single observation as returned by the fluent `Substances` tree:
 * the data point, its dataset context, and every citation resolved —
 * the number never travels without its receipts.
 * @typedef {Object} ResolvedObservation
 * @property {number} year
 * @property {number} val
 * @property {number} [pct]
 * @property {Basis} basis
 * @property {string} [period]
 * @property {string} metricId          Owning dataset id.
 * @property {string} title             Owning dataset title.
 * @property {string} unit              Unit of `val`.
 * @property {Substance} substance
 * @property {Geo} geo
 * @property {ResolvedCitation[]} citations
 */

/**
 * A ResolvedObservation that IS its own numeric value: a Number subclass, so
 * it compares, divides, and formats like the number it wraps (via valueOf),
 * while carrying every observation field plus `.Cite` — the resolved
 * citations. This is what the fluent tree's `.Year()` and `.Series()` return.
 * @typedef {ResolvedObservation & Number & { Cite: ResolvedCitation[] }} Stat
 */

/**
 * A geo-scoped family node: the most recent year's Stat, with the family
 * accessors re-attached and pinned to that geography — so
 * `Substances.Alcohol.Usage('world')` is simultaneously the latest value,
 * its citations (`.Cite`), and the entry point for `.Year(2026)` etc.
 * @typedef {Stat & {
 *   Year: (year: number|string, opts?: object) => Stat,
 *   Month: (year: number|string, month: number, opts?: object) => DerivedPoint,
 *   Day: (year: number|string, month: number, day: number, opts?: object) => DerivedPoint,
 *   Series: (opts?: object) => Stat[],
 *   Files: (opts?: object) => MetricFile[]
 * }} ScopedStat
 */

/**
 * A value arithmetically derived from a reported observation
 * (e.g. an annual count spread across months or days). Always
 * `basis: 'derived'`, always carries the formula in `note` and the
 * source observation in `from`.
 * @typedef {Object} DerivedPoint
 * @property {number} year
 * @property {number} [month]           1-12, present for Month/Day derivations.
 * @property {number} [day]             1-31, present for Day derivations.
 * @property {number} val
 * @property {string} unit
 * @property {'derived'} basis
 * @property {string} note              The derivation formula, spelled out.
 * @property {ResolvedObservation} from The reported observation this came from.
 */

/**
 * One entry in a compound reference sheet (src/data/compounds.yaml) —
 * e.g. THC, CBD, Delta-8. Descriptive reference data, not a time series.
 * @typedef {Object} CompoundInfo
 * @property {string} name              Full chemical/common name.
 * @property {string[]} [aka]           Other names in common use.
 * @property {string} kind              e.g. 'phytocannabinoid', 'semi-synthetic cannabinoid'.
 * @property {boolean} psychoactive
 * @property {string} federal_status    Federal legal status, plain English.
 * @property {string} texas_status      Texas legal status, plain English.
 * @property {{ federal: boolean, texas: boolean }} banned
 *                                      Machine-readable "banned from consumable
 *                                      retail as of the sheet's snapshot" flags —
 *                                      powers the derived 'banned' selector. The
 *                                      prose statuses carry the nuance.
 * @property {string} [note]            Caveats, incl. verification state.
 * @property {string[]} sources         Anchor keys into sources.yaml.
 */

/**
 * A CompoundInfo as returned by the Substances tree: key attached and
 * source anchors resolved.
 * @typedef {CompoundInfo & { key: string, citations: SourceCitation[] }} ResolvedCompound
 */

/**
 * Result of comparing all cited values for one observation.
 * @typedef {Object} ClaimComparison
 * @property {number} year
 * @property {number} consensus        The dataset's primary `val`.
 * @property {number[]} claimed        Every value reported across citations.
 * @property {number} min
 * @property {number} max
 * @property {number} spread           max - min; 0 means all sources agree exactly.
 * @property {boolean} corroborated    True when 2+ independent sources report a value.
 */

export {}
