<!--
  @component WorldMap — the shared DOGS world choropleth, as a dependency-free
  library component (Svelte 5 peer, optional — data-only consumers install nothing).

  Countries in `countries` are shaded by `num` on a 7-step log ramp; everything
  else is a quiet outline. Click/tap selects a country, hover shows a tooltip.

    <script>
      import { getMetric, metricToMapCountries } from '@dogs/proof'
      import { WorldMap } from '@dogs/proof/svelte'
    </script>

    <WorldMap
      countries={metricToMapCountries(getMetric('deaths.alcohol.us.excess'))}
      selected={selectedCode}
      onSelect={(code) => (selectedCode = code)}
    />

  Styling is entirely CSS custom properties with built-in defaults — the
  component renders standalone in any host app, and a host can override any
  of them on the component or an ancestor:

    --map-1 .. --map-7   choropleth ramp, smaller → larger
    --map-empty          fill for countries with no data
    --map-stroke         outline for countries with no data
    --map-stroke-data    outline for countries with data
    --map-hover          hover fill
    --map-selected       selected-country fill
    --map-selected-ink   selected-country outline
    --map-ink            tooltip + legend text
    --map-muted          secondary text
    --map-tip-bg         tooltip background
    --map-tip-border     tooltip border

  Accessibility: the SVG is decorative; every country value is also in the
  visually hidden list below, so no value is hover-only.
-->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<script>
  import worldMapSvg from './assets/world-map.svg?raw'
  import { rampStep } from '../ramp.js'

  const RAMP_STEPS = 7

  /**
   * @typedef {Object} MapCountry
   * @property {string} code   Lowercase ISO 3166-1 alpha-2, matches the SVG path id.
   * @property {string} name   Display name for the tooltip.
   * @property {number} num    Raw value driving the log ramp.
   * @property {string} value  Formatted value for the tooltip.
   */

  let {
    /** @type {MapCountry[]} */
    countries = [],
    /** @type {string | null} */
    selected = null,
    /** @type {(code: string) => void} */
    onSelect
  } = $props()

  let containerEl = $state()
  let hovered = $state(null)
  let mouseX = $state(0)
  let mouseY = $state(0)
  let flipX = $state(false)
  let flipY = $state(false)

  const byCode = $derived(new Map(countries.map((c) => [String(c.code).toLowerCase(), c])))
  const range = $derived.by(() => {
    const nums = countries.map((c) => c.num).filter((n) => n > 0)
    if (nums.length === 0) return { min: 1, max: 1 }
    return { min: Math.min(...nums), max: Math.max(...nums) }
  })
  const selectedCode = $derived((selected ?? '').toLowerCase())

  // Paint fills and selection whenever data changes. Iterating the SVG's own
  // paths (instead of interpolating ids into a selector) keeps arbitrary
  // country codes from ever becoming a selector-injection vector.
  $effect(() => {
    if (!containerEl) return
    for (const el of containerEl.querySelectorAll('path[id], g[id]')) {
      const c = byCode.get(el.id.toLowerCase())
      el.classList.toggle('has-data', !!c)
      el.classList.toggle('selected', !!c && el.id.toLowerCase() === selectedCode)
      if (c) {
        el.style.setProperty('--fill', `var(--map-${rampStep(c.num, range.min, range.max, RAMP_STEPS)})`)
      } else {
        el.style.removeProperty('--fill')
      }
    }
  })

  /** @param {Event} e @returns {string | null} */
  function codeAt(e) {
    const el = /** @type {Element} */ (e.target).closest('path[id], g[id]')
    return el?.id?.toLowerCase() ?? null
  }

  /** @param {MouseEvent} e */
  function handleClick(e) {
    const code = codeAt(e)
    if (code && byCode.has(code)) onSelect?.(code)
  }

  /** @param {MouseEvent} e */
  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX = e.clientX - rect.left
    mouseY = e.clientY - rect.top
    flipX = mouseX > rect.width / 2
    flipY = mouseY > rect.height / 2
    const code = codeAt(e)
    hovered = code && byCode.has(code) ? code : null
  }
</script>

<div
  bind:this={containerEl}
  class="proof-map"
  role="img"
  aria-label="World choropleth map"
  onclick={handleClick}
  onmousemove={handleMouseMove}
  onmouseleave={() => (hovered = null)}
>
  {@html worldMapSvg}

  {#if hovered}
    {@const c = byCode.get(hovered)}
    <div
      class="pm-tip"
      style="left:{mouseX}px; top:{mouseY}px; transform: translate({flipX
        ? 'calc(-100% - 12px)'
        : '12px'}, {flipY ? 'calc(-100% - 12px)' : '12px'})"
    >
      <span class="pm-tip-name">{c.name}</span>
      <span class="pm-tip-val">{c.value}</span>
    </div>
  {/if}

  <div class="pm-legend" aria-hidden="true">
    <span class="pm-eyebrow">Smaller</span>
    {#each Array(RAMP_STEPS) as _, i (i)}
      <span class="pm-swatch" style="background: var(--map-{i + 1})"></span>
    {/each}
    <span class="pm-eyebrow">Larger</span>
  </div>

  <!-- Non-hover access to every value -->
  <ul class="pm-sr" aria-label="Country values">
    {#each countries as c (c.code)}
      <li>{c.name}: {c.value}</li>
    {/each}
  </ul>
</div>

<style>
  .proof-map {
    /* Default theme: PROOF dark. Override any of these from outside. */
    --map-1: #18293e;
    --map-2: #1e3a5c;
    --map-3: #26547e;
    --map-4: #30709f;
    --map-5: #4190c6;
    --map-6: #66abe0;
    --map-7: #93c8f2;
    --map-empty: #14141c;
    --map-stroke: rgba(255, 255, 255, 0.14);
    --map-stroke-data: rgba(255, 255, 255, 0.35);
    --map-hover: #f5f5f4;
    --map-selected: #fbbf24;
    --map-selected-ink: #0f0f16;
    --map-ink: #f4f4f5;
    --map-muted: #8e8e9f;
    --map-tip-bg: rgba(15, 15, 22, 0.94);
    --map-tip-border: rgba(255, 255, 255, 0.16);

    position: relative;
    width: 100%;
    aspect-ratio: 784.077 / 458.627;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    touch-action: pan-y;
    border-radius: 12px;
    background: var(--map-empty);
  }

  .proof-map :global(svg) {
    width: 100%;
    height: 100%;
    display: block;
  }

  .proof-map :global(path) {
    fill: var(--map-empty);
    stroke: var(--map-stroke);
    stroke-width: 0.5px;
    transition:
      fill 0.25s ease,
      stroke 0.25s ease;
  }

  .proof-map :global(.has-data),
  .proof-map :global(.has-data path) {
    fill: var(--fill);
    stroke: var(--map-stroke-data);
    stroke-width: 0.6px;
    cursor: pointer;
  }

  .proof-map :global(.has-data:hover),
  .proof-map :global(.has-data:hover path) {
    fill: var(--map-hover);
  }

  .proof-map :global(.selected),
  .proof-map :global(.selected path) {
    fill: var(--map-selected);
    stroke: var(--map-selected-ink);
    stroke-width: 1px;
  }

  .pm-tip {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.45rem 0.7rem;
    background: var(--map-tip-bg);
    border: 1px solid var(--map-tip-border);
    border-radius: 8px;
    pointer-events: none;
    z-index: 5;
    white-space: nowrap;
  }
  .pm-tip-name {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--map-ink);
  }
  .pm-tip-val {
    font-size: 0.7rem;
    color: var(--map-muted);
    font-variant-numeric: tabular-nums;
  }

  .pm-legend {
    position: absolute;
    left: 0.5rem;
    bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 3px;
    pointer-events: none;
  }
  .pm-swatch {
    width: 14px;
    height: 6px;
    border-radius: 2px;
  }
  .pm-eyebrow {
    font-size: 0.55rem;
    margin: 0 0.3rem;
    color: var(--map-muted);
  }

  /* Visually hidden list: every country value, no hover needed. */
  .pm-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: 0;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
