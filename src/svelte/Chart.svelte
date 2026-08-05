<!--
  @component Chart — the zero-dependency, styleable graph for PROOF data.

  Renders line, area, or grouped-bar time series from any array of
  { year, val } points — which is exactly what Substances.*.Series() and
  the low-level API return, so observations plot without reshaping:

    <Chart
      title="Overdose deaths, United States"
      series={[
        { label: 'Fentanyl', points: Substances.Fentanyl.Deaths.Series() },
        { label: 'Cocaine',  points: Substances.Cocaine.Deaths.Series() }
      ]}
    />

  Styling is entirely CSS custom properties (set them on the component or
  any ancestor); marks inherit series colors via currentColor:

    --proof-chart-surface   card/plot background        (#0f0f16)
    --proof-chart-ink       primary text                (#f4f4f5)
    --proof-chart-muted     secondary text, axis labels (#8e8e9f)
    --proof-chart-grid      hairline gridlines          (rgba(255,255,255,.06))
    --proof-chart-axis      baseline                    (rgba(255,255,255,.16))
    --proof-chart-font      chart typeface              (ui-monospace stack)
    --proof-chart-line      line stroke width           (2px)
    --proof-series-1..6     series colors, assigned in fixed order

  The default series order (blue, amber, emerald, red) is validated for
  color-vision-deficiency separation on the dark surface; slots beyond four
  should be folded or faceted, not extended with new hues.

  Accessibility: every value is reachable without hover (direct end labels +
  a visually hidden data table); the whole chart is keyboard-readable
  (focus, then ArrowLeft/ArrowRight walk the years; Escape clears).
-->
<script>
  /**
   * @typedef {Object} ChartPoint
   * @property {number} year
   * @property {number} val
   * @property {string} [basis]
   * @property {string} [period]
   *
   * @typedef {Object} ChartSeries
   * @property {string} label
   * @property {ChartPoint[]} points
   */

  let {
    /** @type {ChartSeries[]} */
    series = [],
    /** @type {'line' | 'area' | 'bar'} */
    type = 'line',
    title = '',
    /** Unit string from the dataset (drives value formatting). */
    unit = '',
    /** Plot height in px (the component is fluid-width). */
    height = 220,
    class: className = ''
  } = $props()

  const TOP_PAD = 10
  const BOTTOM_PAD = 26
  const CHAR_W = 7.4 // approx mono glyph width at 11px, for label measuring
  const MAX_BAR_W = 24
  const BAR_GAP = 2
  const END_LABEL_MIN_GAP = 14

  let width = $state(0)
  /** @type {number | null} */
  let activeIndex = $state(null)

  const clean = $derived(
    series
      .filter((s) => s && Array.isArray(s.points) && s.points.length > 0)
      .map((s) => ({ ...s, points: s.points.slice().sort((a, b) => a.year - b.year) }))
  )
  const years = $derived(
    [...new Set(clean.flatMap((s) => s.points.map((p) => p.year)))].sort((a, b) => a - b)
  )
  const resolvedUnit = $derived(unit || clean[0]?.points[0]?.unit || '')
  const isPercent = $derived(resolvedUnit.startsWith('percent'))
  const isUsd = $derived(resolvedUnit.startsWith('usd'))

  /** Compact display value: 79358 -> 79.4K, 5.5e9 usd -> $5.5B, 21.8 pct -> 21.8% */
  function fmt(v) {
    if (isPercent) return `${v}%`
    const prefix = isUsd ? '$' : ''
    const abs = Math.abs(v)
    if (abs >= 1e9) return `${prefix}${trim(v / 1e9)}B`
    if (abs >= 1e6) return `${prefix}${trim(v / 1e6)}M`
    if (abs >= 1e4) return `${prefix}${trim(v / 1e3)}K`
    return `${prefix}${v.toLocaleString('en-US')}`
  }

  function trim(v) {
    return (Math.round(v * 10) / 10).toLocaleString('en-US')
  }

  /** Full-precision tooltip value. */
  function fmtLong(v) {
    if (isPercent) return `${v}%`
    return `${isUsd ? '$' : ''}${v.toLocaleString('en-US')}`
  }

  const dataMax = $derived(Math.max(1e-9, ...clean.flatMap((s) => s.points.map((p) => p.val))))

  // Clean zero-based ticks: pick the first nice step giving <= 5 intervals.
  const ticks = $derived.by(() => {
    const base = Math.pow(10, Math.floor(Math.log10(dataMax / 4)))
    const step = [1, 2, 2.5, 5, 10].map((m) => m * base).find((s) => Math.ceil(dataMax / s) <= 5)
    const top = Math.ceil(dataMax / step) * step
    const out = []
    for (let v = 0; v <= top + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6)
    return out
  })
  const yMax = $derived(ticks.at(-1) ?? 1)

  const padLeft = $derived(10 + Math.max(...ticks.map((t) => fmt(t).length)) * CHAR_W)
  const endLabels = $derived(type !== 'bar' && clean.length >= 1)
  const padRight = $derived(
    endLabels ? 16 + Math.max(...clean.map((s) => fmt(s.points.at(-1).val).length)) * CHAR_W : 12
  )
  const plotW = $derived(Math.max(0, width - padLeft - padRight))
  const plotH = $derived(height - TOP_PAD - BOTTOM_PAD)

  function yPos(v) {
    return TOP_PAD + plotH - (v / yMax) * plotH
  }

  // Line/area x: linear in year. Bars: one band per year.
  function xPos(year) {
    if (years.length === 1) return padLeft + plotW / 2
    const [y0, y1] = [years[0], years.at(-1)]
    return padLeft + ((year - y0) / (y1 - y0)) * plotW
  }
  const band = $derived(plotW / Math.max(1, years.length))
  function bandX(yearIdx) {
    return padLeft + band * yearIdx
  }
  const barW = $derived.by(() => {
    const n = Math.max(1, clean.length)
    return Math.min(MAX_BAR_W, (band * 0.7 - BAR_GAP * (n - 1)) / n)
  })

  function linePath(points) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xPos(p.year)},${yPos(p.val)}`).join('')
  }
  function areaPath(points) {
    const base = yPos(0)
    return `${linePath(points)}L${xPos(points.at(-1).year)},${base}L${xPos(points[0].year)},${base}Z`
  }
  /** Bar with a 4px rounded data-end and a square baseline. */
  function barPath(x, y, w) {
    const base = yPos(0)
    const r = Math.min(4, w / 2, Math.max(0, base - y))
    return `M${x},${base}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${base}Z`
  }

  // Direct end labels, collision-nudged apart top-down.
  const endLabelYs = $derived.by(() => {
    if (!endLabels) return []
    const placed = clean
      .map((s, i) => ({ i, y: yPos(s.points.at(-1).val) }))
      .sort((a, b) => a.y - b.y)
    for (let k = 1; k < placed.length; k++) {
      placed[k].y = Math.max(placed[k].y, placed[k - 1].y + END_LABEL_MIN_GAP)
    }
    const out = []
    for (const p of placed) out[p.i] = Math.min(p.y, TOP_PAD + plotH)
    return out
  })

  const active = $derived.by(() => {
    if (activeIndex === null || !years[activeIndex]) return null
    const year = years[activeIndex]
    const rows = clean
      .map((s, i) => ({ label: s.label, slot: i + 1, point: s.points.find((p) => p.year === year) }))
      .filter((r) => r.point)
    const x = type === 'bar' ? bandX(activeIndex) + band / 2 : xPos(year)
    return { year, rows, x }
  })

  function indexFromPointer(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = event.clientX - rect.left
    if (type === 'bar') {
      return Math.max(0, Math.min(years.length - 1, Math.floor((px - padLeft) / band)))
    }
    let best = 0
    for (let i = 1; i < years.length; i++) {
      if (Math.abs(xPos(years[i]) - px) < Math.abs(xPos(years[best]) - px)) best = i
    }
    return best
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      activeIndex = null
      return
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const delta = event.key === 'ArrowRight' ? 1 : -1
    const from = activeIndex ?? (delta > 0 ? -1 : years.length)
    activeIndex = Math.max(0, Math.min(years.length - 1, from + delta))
  }

  const tooltipLeft = $derived(
    active ? Math.max(4, Math.min(active.x + 10, width - 150)) : 0
  )
</script>

<!-- Deliberately interactive: the focusable figure is the keyboard surface
     for walking the years (ArrowLeft/ArrowRight), mirroring pointer hover. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_no_noninteractive_tabindex -->
<figure
  class={`proof-chart ${className}`}
  role="img"
  aria-label={title || 'chart'}
  tabindex="0"
  onkeydown={onKeydown}
  onblur={() => (activeIndex = null)}
>
  {#if title}
    <figcaption class="pc-title">{title}</figcaption>
  {/if}

  {#if clean.length >= 2}
    <div class="pc-legend" aria-hidden="true">
      {#each clean as s, i (s.label)}
        <span class="pc-key" style={`color: var(--proof-series-${i + 1})`}>
          {#if type === 'bar'}<span class="pc-swatch-rect"></span>{:else}<span class="pc-swatch-line"></span>{/if}
          <span class="pc-key-label">{s.label}</span>
        </span>
      {/each}
    </div>
  {/if}

  <div class="pc-plot" bind:clientWidth={width} style={`height: ${height}px`}>
    {#if width > 0 && clean.length > 0}
      <!-- Decorative rendering layer: the figure's aria-label and the data
           table below carry the semantics; pointer events only drive hover. -->
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="presentation"
        aria-hidden="true"
        onpointermove={(e) => (activeIndex = indexFromPointer(e))}
        onpointerleave={() => (activeIndex = null)}
      >
        <!-- gridlines + y ticks (recessive, hairline, solid) -->
        {#each ticks as t (t)}
          <line class="pc-grid" x1={padLeft} x2={width - padRight} y1={yPos(t)} y2={yPos(t)} />
          <text class="pc-tick" x={padLeft - 6} y={yPos(t) + 3.5} text-anchor="end">{fmt(t)}</text>
        {/each}
        <line class="pc-baseline" x1={padLeft} x2={width - padRight} y1={yPos(0)} y2={yPos(0)} />

        <!-- x labels: years -->
        {#each years as year, i (year)}
          <text
            class="pc-tick"
            x={type === 'bar' ? bandX(i) + band / 2 : xPos(year)}
            y={height - 8}
            text-anchor="middle">{year}</text
          >
        {/each}

        {#if type === 'bar'}
          {#each clean as s, si (s.label)}
            <g style={`color: var(--proof-series-${si + 1})`}>
              {#each s.points as p (p.year)}
                {@const yi = years.indexOf(p.year)}
                {@const groupW = clean.length * barW + (clean.length - 1) * BAR_GAP}
                {@const x = bandX(yi) + (band - groupW) / 2 + si * (barW + BAR_GAP)}
                <path
                  class="pc-bar"
                  class:pc-dim={activeIndex !== null && activeIndex !== yi}
                  d={barPath(x, yPos(p.val), barW)}
                  fill="currentColor"
                />
              {/each}
            </g>
          {/each}
        {:else}
          {#each clean as s, si (s.label)}
            <g style={`color: var(--proof-series-${si + 1})`}>
              {#if type === 'area'}
                <path d={areaPath(s.points)} fill="currentColor" opacity="0.1" />
              {/if}
              <path class="pc-line" d={linePath(s.points)} fill="none" stroke="currentColor" />
              {#each s.points as p (p.year)}
                <circle
                  class="pc-dot"
                  class:pc-dot-active={active?.year === p.year}
                  cx={xPos(p.year)}
                  cy={yPos(p.val)}
                  r="4"
                  fill="currentColor"
                />
              {/each}
              <!-- direct end label: the value, in ink, beside the line's end -->
              <text
                class="pc-endlabel"
                x={xPos(s.points.at(-1).year) + 10}
                y={endLabelYs[si] + 3.5}>{fmt(s.points.at(-1).val)}</text
              >
            </g>
          {/each}
        {/if}

        <!-- crosshair -->
        {#if active && type !== 'bar'}
          <line
            class="pc-crosshair"
            x1={active.x}
            x2={active.x}
            y1={TOP_PAD}
            y2={TOP_PAD + plotH}
          />
        {/if}
      </svg>

      {#if active}
        <div class="pc-tooltip" style={`left: ${tooltipLeft}px; top: ${TOP_PAD}px`}>
          <div class="pc-tooltip-year">{active.year}</div>
          {#each active.rows as row (row.label)}
            <div class="pc-tooltip-row">
              <span class="pc-swatch-line" style={`color: var(--proof-series-${row.slot})`}></span>
              <span class="pc-tooltip-val">{fmtLong(row.point.val)}</span>
              <span class="pc-tooltip-label">{row.label}</span>
              {#if row.point.basis && row.point.basis !== 'reported'}
                <span class="pc-tooltip-basis">{row.point.basis}</span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>

  <!-- Non-hover access to every value -->
  <div class="pc-sr">
    <table>
    <caption>{title}</caption>
    <thead>
      <tr>
        <th scope="col">Year</th>
        {#each clean as s (s.label)}<th scope="col">{s.label}</th>{/each}
      </tr>
    </thead>
    <tbody>
      {#each years as year (year)}
        <tr>
          <th scope="row">{year}</th>
          {#each clean as s (s.label)}
            <td>{s.points.find((p) => p.year === year)?.val ?? '—'}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
    </table>
  </div>
</figure>

<style>
  .proof-chart {
    /* Default theme: PROOF dark. Override any of these from outside. */
    --proof-chart-surface: #0f0f16;
    --proof-chart-ink: #f4f4f5;
    --proof-chart-muted: #8e8e9f;
    --proof-chart-grid: rgba(255, 255, 255, 0.06);
    --proof-chart-axis: rgba(255, 255, 255, 0.16);
    --proof-chart-font: ui-monospace, 'Cascadia Code', 'SF Mono', Menlo, Consolas, monospace;
    --proof-chart-line: 2px;
    /* Series slots: CVD-validated fixed order on the dark surface (blue,
       amber, emerald, red). Past four, fold or facet instead of extending. */
    --proof-series-1: #3b82f6;
    --proof-series-2: #d97706;
    --proof-series-3: #059669;
    --proof-series-4: #ef4444;
    --proof-series-5: #8b5cf6;
    --proof-series-6: #ec4899;

    margin: 0;
    background: var(--proof-chart-surface);
    color: var(--proof-chart-ink);
    font-family: var(--proof-chart-font);
    border-radius: 12px;
    padding: 14px 14px 8px;
    outline: none;
  }
  .proof-chart:focus-visible {
    box-shadow: 0 0 0 2px var(--proof-series-1);
  }

  .pc-title {
    font-size: 12px;
    letter-spacing: 0.02em;
    color: var(--proof-chart-ink);
    margin-bottom: 8px;
  }

  .pc-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin-bottom: 8px;
  }
  .pc-key {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
  }
  .pc-key-label {
    color: var(--proof-chart-muted);
  }
  .pc-swatch-line {
    display: inline-block;
    width: 12px;
    height: 2px;
    border-radius: 1px;
    background: currentColor;
  }
  .pc-swatch-rect {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 3px;
    background: currentColor;
  }

  .pc-plot {
    position: relative;
    width: 100%;
  }
  svg {
    display: block;
    touch-action: none;
    max-width: 100%;
  }

  .pc-grid {
    stroke: var(--proof-chart-grid);
    stroke-width: 1;
  }
  .pc-baseline {
    stroke: var(--proof-chart-axis);
    stroke-width: 1;
  }
  .pc-tick {
    font-size: 10px;
    fill: var(--proof-chart-muted);
    font-variant-numeric: tabular-nums;
  }
  .pc-endlabel {
    font-size: 11px;
    fill: var(--proof-chart-ink);
    font-variant-numeric: tabular-nums;
  }

  .pc-line {
    stroke-width: var(--proof-chart-line);
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .pc-dot {
    stroke: var(--proof-chart-surface); /* the 2px surface ring */
    stroke-width: 2;
    opacity: 0;
    transition: opacity 120ms;
  }
  .pc-dot:last-of-type,
  .pc-dot-active {
    opacity: 1;
  }
  .pc-bar {
    transition: opacity 120ms;
  }
  .pc-dim {
    opacity: 0.45;
  }
  .pc-crosshair {
    stroke: var(--proof-chart-axis);
    stroke-width: 1;
    pointer-events: none;
  }

  .pc-tooltip {
    position: absolute;
    pointer-events: none;
    background: color-mix(in srgb, var(--proof-chart-surface) 88%, black);
    border: 1px solid var(--proof-chart-grid);
    border-radius: 8px;
    padding: 7px 9px;
    min-width: 120px;
    z-index: 2;
  }
  .pc-tooltip-year {
    font-size: 10px;
    color: var(--proof-chart-muted);
    margin-bottom: 3px;
  }
  .pc-tooltip-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    line-height: 1.7;
  }
  .pc-tooltip-val {
    font-weight: 600;
    color: var(--proof-chart-ink);
    font-variant-numeric: tabular-nums;
  }
  .pc-tooltip-label {
    color: var(--proof-chart-muted);
  }
  .pc-tooltip-basis {
    color: var(--proof-chart-muted);
    font-size: 9px;
    border: 1px solid var(--proof-chart-grid);
    border-radius: 4px;
    padding: 0 4px;
  }

  /* Visually hidden wrapper (a div, because overflow does not clip table boxes). */
  .pc-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
