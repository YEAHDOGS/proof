<!--
  @component App — the PROOF documentation site (`npm run dev`).

  Example-first: every snippet on this page executes against the real
  library at render time, so the docs cannot drift from the code.
-->
<script>
  import { Substances, getAllMetrics } from './index.js'
  import { Chart } from './svelte/index.js'
  import Example from './docs/Example.svelte'
  import { SECTIONS } from './docs/examples.js'

  const APP_MAX_WIDTH = 'max-w-7xl 2xl:max-w-[90rem]'
  const INSTALL_CMD = 'npm i @dogs/proof'

  const METRICS_SORTED = getAllMetrics().sort((a, b) => a.id.localeCompare(b.id))
  const SOURCE_COUNT = new Set(
    METRICS_SORTED.flatMap((m) => m.observations.flatMap((p) => p.citations.map((c) => c.src)))
  ).size

  const DEATH_SERIES = [
    { label: 'Any opioid', points: Substances.Opioids.Deaths.Series() },
    { label: 'Fentanyl', points: Substances.Fentanyl.Deaths.Series() },
    { label: 'Meth/stimulants', points: Substances.Amphetamines.Deaths.Series() },
    { label: 'Cocaine', points: Substances.Cocaine.Deaths.Series() }
  ]
  const ER_SERIES = [
    { label: 'Alcohol', points: Substances.Alcohol.ERVisits.Series() },
    { label: 'Cannabis', points: Substances.Marijuana.ERVisits.Series() }
  ]
  const USAGE_SERIES = [{ label: 'Cannabis, past-year %', points: Substances.Marijuana.Usage.Series() }]

  const NAV = [
    ...SECTIONS.map((s) => ({ id: s.id, heading: s.heading })),
    { id: 'charts', heading: 'Charts' },
    { id: 'datasets', heading: 'Datasets' },
    { id: 'integrity', heading: 'Integrity' }
  ]

  const CHART_BASIC_CODE = `import { Substances } from '@dogs/proof'
import { Chart } from '@dogs/proof/svelte'

const deaths = [
  { label: 'Any opioid', points: Substances.Opioids.Deaths.Series() },
  { label: 'Fentanyl', points: Substances.Fentanyl.Deaths.Series() },
  { label: 'Meth/stimulants', points: Substances.Amphetamines.Deaths.Series() },
  { label: 'Cocaine', points: Substances.Cocaine.Deaths.Series() }
]

<Chart title="US overdose deaths (NCHS via NIDA)" series={deaths} />`

  const CHART_BAR_CODE = `<Chart
  type="bar"
  title="Emergency department visits, 2023 (DAWN)"
  series={[
    { label: 'Alcohol', points: Substances.Alcohol.ERVisits.Series() },
    { label: 'Cannabis', points: Substances.Marijuana.ERVisits.Series() }
  ]}
/>`

  const CHART_AREA_CODE = `<Chart
  type="area"
  title="Past-year cannabis use, US, ages 12+ (NSDUH)"
  series={[{ label: 'Cannabis, past-year %', points: Substances.Marijuana.Usage.Series() }]}
/>`

  const CHART_STYLE_CODE = `<div class="my-theme">
  <Chart type="area" title="…" series={…} />
</div>

<style>
  .my-theme {
    --proof-chart-surface: #1c1917;  /* stone-900 */
    --proof-chart-line: 3px;
    --proof-series-1: #fbbf24;       /* campaign amber */
    --proof-chart-grid: rgba(251, 191, 36, 0.08);
  }
</style>`

  const STYLE_OVERRIDE =
    '--proof-chart-surface:#1c1917; --proof-chart-line:3px; --proof-series-1:#fbbf24; --proof-chart-grid:rgba(251,191,36,.08)'

  /** @param {import('./types.js').MetricFile} m */
  function yearSpan(m) {
    const years = m.observations.map((p) => p.year)
    const [lo, hi] = [Math.min(...years), Math.max(...years)]
    return lo === hi ? `${lo}` : `${lo}–${hi}`
  }
</script>

<svelte:head>
  <title>PROOF — @dogs/proof documentation</title>
</svelte:head>

<div class="min-h-dvh w-full bg-[#050508] text-white">
  <div class="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.06),transparent_60%)] pointer-events-none"></div>

  <!-- HERO -->
  <header class="relative w-full mx-auto {APP_MAX_WIDTH} px-4 sm:px-6 lg:px-10 pt-10 sm:pt-14 lg:pt-20 pb-6">
    <p class="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-amber-400/80 mb-3">DOGS · proof.wearedogs.net</p>
    <h1 class="text-4xl sm:text-5xl lg:text-6xl 2xl:text-7xl font-bold tracking-tight">PROOF</h1>
    <p class="mt-3 max-w-2xl text-sm sm:text-base text-neutral-400 leading-relaxed">
      Cited substance statistics — every number chiseled in stone. Multi-source citations for
      THC/cannabis, alcohol, and more across the US and Texas, from one tiny zero-dependency package.
    </p>

    <div class="mt-5 flex flex-wrap items-center gap-3">
      <code class="text-xs sm:text-sm font-mono bg-[#0e0e12] border border-white/10 rounded-lg px-4 py-2.5 text-amber-200 select-all">{INSTALL_CMD}</code>
      <div class="flex flex-wrap gap-2 text-[10px] sm:text-xs font-mono text-neutral-500">
        <span class="border border-white/5 rounded-full px-3 py-1"><span class="text-emerald-400">{METRICS_SORTED.length}</span> datasets</span>
        <span class="border border-white/5 rounded-full px-3 py-1"><span class="text-emerald-400">{SOURCE_COUNT}</span> cited sources</span>
        <span class="border border-white/5 rounded-full px-3 py-1">zero runtime deps</span>
      </div>
    </div>

    <!-- NAV -->
    <nav class="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs sm:text-sm border-t border-white/5 pt-4" aria-label="sections">
      {#each NAV as item (item.id)}
        <a class="text-neutral-400 hover:text-amber-300 transition-colors" href={`#${item.id}`}>{item.heading}</a>
      {/each}
    </nav>
  </header>

  <main class="relative w-full mx-auto {APP_MAX_WIDTH} px-4 sm:px-6 lg:px-10 pb-20 flex flex-col gap-12 sm:gap-16">
    {#each SECTIONS as section (section.id)}
      <section id={section.id} class="scroll-mt-6">
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight mb-1.5">{section.heading}</h2>
        <p class="text-xs sm:text-sm text-neutral-500 max-w-3xl leading-relaxed mb-5">{section.blurb}</p>
        <div class="flex flex-col gap-4">
          {#each section.examples as example (example.title)}
            <Example {...example} />
          {/each}
        </div>
      </section>
    {/each}

    <!-- CHARTS -->
    <section id="charts" class="scroll-mt-6">
      <h2 class="text-xl sm:text-2xl font-bold tracking-tight mb-1.5">Charts</h2>
      <p class="text-xs sm:text-sm text-neutral-500 max-w-3xl leading-relaxed mb-5">
        <code class="text-amber-200/90">@dogs/proof/svelte</code> ships a zero-dependency SVG
        <code class="text-amber-200/90">Chart</code> component (Svelte 5 peer). It plots whatever
        <code class="text-amber-200/90">Series()</code> returns — line, area, or grouped bars — with
        hover crosshair, keyboard navigation (focus + arrow keys), a screen-reader data table, and
        theming through CSS custom properties alone.
      </p>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article class="rounded-xl border border-white/5 bg-[#0e0e12]/60 overflow-hidden">
          <pre class="px-4 py-3 text-[11px] leading-relaxed text-neutral-200 whitespace-pre-wrap break-words font-mono bg-black/30 border-b border-white/5">{CHART_BASIC_CODE}</pre>
          <div class="p-3">
            <Chart title="US overdose deaths (NCHS via NIDA)" series={DEATH_SERIES} height={240} />
          </div>
        </article>

        <div class="flex flex-col gap-4">
          <article class="rounded-xl border border-white/5 bg-[#0e0e12]/60 overflow-hidden">
            <pre class="px-4 py-3 text-[11px] leading-relaxed text-neutral-200 whitespace-pre-wrap break-words font-mono bg-black/30 border-b border-white/5">{CHART_BAR_CODE}</pre>
            <div class="p-3">
              <Chart type="bar" title="Emergency department visits, 2023 (DAWN)" series={ER_SERIES} height={180} />
            </div>
          </article>

          <article class="rounded-xl border border-white/5 bg-[#0e0e12]/60 overflow-hidden">
            <pre class="px-4 py-3 text-[11px] leading-relaxed text-neutral-200 whitespace-pre-wrap break-words font-mono bg-black/30 border-b border-white/5">{CHART_AREA_CODE}</pre>
            <div class="p-3">
              <Chart type="area" title="Past-year cannabis use, US, ages 12+ (NSDUH)" series={USAGE_SERIES} height={180} />
            </div>
          </article>
        </div>

        <article class="rounded-xl border border-white/5 bg-[#0e0e12]/60 overflow-hidden xl:col-span-2">
          <header class="px-4 pt-3 pb-2">
            <h3 class="text-sm font-semibold tracking-wide">Styleable, entirely through CSS custom properties</h3>
            <p class="text-xs text-neutral-500 mt-0.5">
              Set the variables on the component or any ancestor — surface, ink, grid, typeface, line
              weight, and the fixed-order series slots. No props, no config objects, no fork.
            </p>
          </header>
          <div class="grid grid-cols-1 lg:grid-cols-2 border-t border-white/5">
            <pre class="px-4 py-3 text-[11px] leading-relaxed text-neutral-200 whitespace-pre-wrap break-words font-mono bg-black/30">{CHART_STYLE_CODE}</pre>
            <div class="p-3 border-t lg:border-t-0 lg:border-l border-white/5" style={STYLE_OVERRIDE}>
              <Chart type="area" title="Same component, campaign-amber theme" series={USAGE_SERIES} height={200} />
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- DATASETS -->
    <section id="datasets" class="scroll-mt-6">
      <h2 class="text-xl sm:text-2xl font-bold tracking-tight mb-1.5">Dataset catalog</h2>
      <p class="text-xs sm:text-sm text-neutral-500 max-w-3xl leading-relaxed mb-5">
        Everything currently compiled into the bundle. <span class="text-emerald-400">cross-checked</span>
        = every value verified against 2+ publications; <span class="text-amber-400">seeded</span> =
        entered and cited, awaiting that audit.
      </p>

      <!-- md+: table -->
      <div class="hidden md:block rounded-xl border border-white/5 overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#0e0e12] text-neutral-500 uppercase tracking-wider text-[10px]">
            <tr>
              <th class="px-4 py-2.5 font-medium">id</th>
              <th class="px-4 py-2.5 font-medium">title</th>
              <th class="px-3 py-2.5 font-medium">geo</th>
              <th class="px-3 py-2.5 font-medium">years</th>
              <th class="px-4 py-2.5 font-medium">verification</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            {#each METRICS_SORTED as m (m.id)}
              <tr class="hover:bg-white/[0.02] transition-colors">
                <td class="px-4 py-2 font-mono text-amber-200/80">{m.id}</td>
                <td class="px-4 py-2 text-neutral-300">{m.title}</td>
                <td class="px-3 py-2 font-mono text-neutral-400">{m.geo}</td>
                <td class="px-3 py-2 font-mono text-neutral-400">{yearSpan(m)}</td>
                <td class="px-4 py-2">
                  <span class={`font-mono text-[10px] rounded-full px-2 py-0.5 border ${m.verification === 'cross-checked' ? 'text-emerald-400 border-emerald-400/30' : 'text-amber-400 border-amber-400/30'}`}>{m.verification}</span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- mobile: cards -->
      <div class="md:hidden flex flex-col gap-2">
        {#each METRICS_SORTED as m (m.id)}
          <div class="rounded-lg border border-white/5 bg-[#0e0e12]/60 px-3 py-2.5">
            <p class="font-mono text-[11px] text-amber-200/80 break-words">{m.id}</p>
            <p class="text-xs text-neutral-300 mt-0.5">{m.title}</p>
            <p class="font-mono text-[10px] text-neutral-500 mt-1">
              {m.geo} · {yearSpan(m)} ·
              <span class={m.verification === 'cross-checked' ? 'text-emerald-400' : 'text-amber-400'}>{m.verification}</span>
            </p>
          </div>
        {/each}
      </div>
    </section>

    <!-- INTEGRITY -->
    <section id="integrity" class="scroll-mt-6 max-w-3xl">
      <h2 class="text-xl sm:text-2xl font-bold tracking-tight mb-1.5">Data integrity policy</h2>
      <ul class="text-xs sm:text-sm text-neutral-400 leading-relaxed list-disc pl-5 flex flex-col gap-1.5 mt-3">
        <li>Every observation cites at least one source; the target is 2+ independent publications.</li>
        <li>Citations record the value <em>as that source reports it</em> — disagreements are preserved and surfaced by <code class="text-amber-200/90">compareClaims</code>, never averaged away.</li>
        <li><code class="text-amber-200/90">basis</code> grades every figure: reported / derived / modelled / contested / none — "none" means no reliable public figure exists, said honestly instead of guessed.</li>
        <li>Non-calendar periods (fiscal years, multi-year averages) are always disclosed via <code class="text-amber-200/90">period</code>.</li>
        <li>CI runs <code class="text-amber-200/90">validateDataset</code> on every dataset, every push.</li>
      </ul>
    </section>
  </main>

  <footer class="w-full mx-auto {APP_MAX_WIDTH} px-4 sm:px-6 lg:px-10 pb-8 border-t border-white/5 pt-4">
    <p class="text-[10px] tracking-wider text-neutral-600">
      &copy; {new Date().getFullYear()} DOGS · <a href="https://cptnbrando.com" target="_blank" rel="noopener noreferrer" class="hover:text-white underline transition-colors">wearedogs</a>
    </p>
  </footer>
</div>
