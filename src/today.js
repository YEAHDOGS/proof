/**
 * @file "Deaths today" estimators: prorate a dataset's latest annual death
 * count across the year and the current day.
 *
 * Every result carries `basis: 'estimated'` and a note spelling out the
 * proration — an estimate is labeled as an estimate, never presented as a
 * measured count. That is the library's honesty rule, and it is what makes
 * a "deaths today" counter defensible in front of a legislator: the number
 * is arithmetic on a cited annual figure, and it says so.
 */

/** @typedef {import('./types.js').MetricFile} MetricFile */
/** @typedef {import('./types.js').DataPoint} DataPoint */

const DAYS_PER_YEAR = 365
const MS_PER_DAY = 86_400_000

/** Units that hold annual death counts. @type {Set<string>} */
const ANNUAL_DEATH_UNITS = new Set(['deaths', 'deaths_per_year'])

const ESTIMATE_PREAMBLE =
  'Prorated estimate, not a measured count: the latest cited annual figure spread evenly.'

/**
 * A labeled estimate derived from one annual observation.
 * @typedef {Object} TodayEstimate
 * @property {number} val            The estimated value.
 * @property {number} year           Year of the source annual observation.
 * @property {string} unit           'deaths_per_day' or 'deaths'.
 * @property {string} metric         The measure `val` expresses, inherited.
 * @property {'estimated'} basis     Always 'estimated' — never a measured count.
 * @property {string} note           The derivation, spelled out for the reader.
 * @property {DataPoint} from        The source annual observation.
 * @property {string} metricId       Owning dataset id, for citation lookups.
 */

/**
 * The latest annual observation when it holds death counts, else null.
 * @param {MetricFile | null | undefined} metricFile
 * @returns {DataPoint | null}
 */
function latestAnnualDeaths(metricFile) {
  if (!metricFile) return null
  if (!ANNUAL_DEATH_UNITS.has(metricFile.unit)) return null
  if (!Array.isArray(metricFile.observations) || metricFile.observations.length === 0) return null
  const latest = metricFile.observations.reduce((a, b) => (b.year > a.year ? b : a))
  if (typeof latest.val !== 'number' || !Number.isFinite(latest.val) || latest.val < 0) return null
  return latest
}

/**
 * Latest annual death count spread across the year: deaths per day.
 * Returns null for metrics that don't carry annual death counts
 * (usage shares, sales dollars, ER visits, ...).
 * @param {MetricFile | null | undefined} metricFile
 * @returns {TodayEstimate | null}
 */
export function deathsPerDay(metricFile) {
  const point = latestAnnualDeaths(metricFile)
  if (!point) return null
  return {
    val: point.val / DAYS_PER_YEAR,
    year: point.year,
    unit: 'deaths_per_day',
    metric: /** @type {MetricFile} */ (metricFile).metric,
    basis: 'estimated',
    note: `${ESTIMATE_PREAMBLE} Annual figure ${point.val.toLocaleString('en-US')} (${point.year}) / ${DAYS_PER_YEAR}.`,
    from: point,
    metricId: /** @type {MetricFile} */ (metricFile).id
  }
}

/**
 * Estimated deaths elapsed so far today, in local time: the per-day rate
 * times the fraction of the day already gone. Returns null for metrics
 * that don't carry annual death counts.
 * @param {MetricFile | null | undefined} metricFile
 * @param {Date} [now]  Injectable clock; defaults to the current time.
 * @returns {TodayEstimate | null}
 */
export function deathsToday(metricFile, now = new Date()) {
  const perDay = deathsPerDay(metricFile)
  if (!perDay) return null
  const midnight = new Date(now)
  midnight.setHours(0, 0, 0, 0)
  const fraction = (now.getTime() - midnight.getTime()) / MS_PER_DAY
  const clock = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return {
    ...perDay,
    val: perDay.val * fraction,
    unit: 'deaths',
    note: `${ESTIMATE_PREAMBLE} ${perDay.val.toLocaleString('en-US', { maximumFractionDigits: 1 })}/day x ${(fraction * 100).toFixed(1)}% of the local day elapsed (as of ${clock} local).`
  }
}
