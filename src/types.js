/**
 * @file Core type definitions for the thc-stats library.
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
 * Substance tracked by a dataset.
 * @typedef {'CANNABIS' | 'ALCOHOL'} Substance
 */

/**
 * Geographic scope of a dataset. Two-letter USPS code for states,
 * 'US' for national, city slugs (e.g. 'TX-AUSTIN') reserved for later.
 * @typedef {'US' | 'TX'} Geo
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
 * @property {number} [val]      The value as reported by this source, in the
 *                               dataset's `unit`. Omit when the source confirms
 *                               the observation without restating the number.
 * @property {string} [locator]  Where inside the source the number appears
 *                               (table id, page, figure), e.g. 'Table 1.29B'.
 * @property {string} [quote]    Short verbatim excerpt backing the value.
 * @property {string} [note]     Free-form caveat (methodology change, rounding).
 */

/**
 * One time-series observation.
 * @typedef {Object} DataPoint
 * @property {number} year            Calendar/survey year of the observation.
 * @property {number} val             Primary value, expressed in the dataset's `unit`.
 * @property {number} [pct]           Optional percentage companion when `val`
 *                                    is an absolute count (e.g. millions of people).
 * @property {string} src             Primary source anchor (must also appear in `citations`).
 * @property {Citation[]} citations   All source claims for this observation.
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
 * @property {Substance} substance
 * @property {Geo} geo
 * @property {string} metric                    Machine-readable measure name, e.g. 'past_year_use'.
 * @property {string} unit                      Unit of `val`, e.g. 'percent_population_12_plus'.
 * @property {string} title                     Human-readable title.
 * @property {string} [description]             Methodology notes and caveats.
 * @property {VerificationStatus} verification  Citation-audit status of the whole file.
 * @property {DataPoint[]} observations         The time series.
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
