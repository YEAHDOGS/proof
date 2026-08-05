<!--
  @component Example — one live documentation example: the snippet on the
  left, its actual evaluated result on the right. `run()` executes at render,
  so the panel can never show anything the library does not really return.
-->
<script>
  /** @type {{ title: string, note?: string, code: string, run: () => unknown, throws?: boolean }} */
  let { title, note = '', code, run, throws = false } = $props()

  /** @type {{ ok: boolean, value?: unknown, message?: string }} */
  const result = (() => {
    try {
      return { ok: true, value: run() }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) }
    }
  })()

  // Stats are Number subclasses; spread them so the JSON panel shows their
  // fields instead of collapsing to the bare number.
  const plain =
    result.ok && result.value instanceof Number ? { ...result.value } : result.value
  const pretty = result.ok ? JSON.stringify(plain, null, 2) : ''
  const isLong = pretty.length > 320
  const rawHeadline =
    result.ok && result.value !== null && typeof result.value === 'object' && 'val' in result.value
      ? /** @type {{val: unknown}} */ (result.value).val
      : null
  const headline =
    typeof rawHeadline === 'number'
      ? rawHeadline.toLocaleString('en-US', { maximumFractionDigits: 2 })
      : rawHeadline !== null
        ? String(rawHeadline)
        : null
</script>

<article class="rounded-xl border border-white/5 bg-[#0e0e12]/60 overflow-hidden">
  <header class="px-4 pt-3 pb-2">
    <h3 class="text-sm font-semibold tracking-wide text-white">{title}</h3>
    {#if note}<p class="text-xs text-neutral-500 mt-0.5 leading-relaxed">{note}</p>{/if}
  </header>

  <div class="grid grid-cols-1 lg:grid-cols-2 border-t border-white/5">
    <pre
      class="px-4 py-3 text-[11px] sm:text-xs leading-relaxed text-neutral-200 whitespace-pre-wrap break-words font-mono bg-black/30">{code}</pre>

    <div class="px-4 py-3 border-t lg:border-t-0 lg:border-l border-white/5 min-w-0">
      {#if !result.ok}
        <p class="text-[10px] uppercase tracking-widest {throws ? 'text-amber-400' : 'text-red-400'} mb-1.5">
          {throws ? 'throws (by design)' : 'error'}
        </p>
        <p class="text-xs text-neutral-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
          {result.message}
        </p>
      {:else}
        <p class="text-[10px] uppercase tracking-widest text-emerald-400 mb-1.5">returns</p>
        {#if headline !== null}
          <p class="text-lg font-mono text-white mb-1.5">{headline}</p>
        {/if}
        {#if isLong}
          <details class="group">
            <summary
              class="cursor-pointer text-xs text-neutral-400 hover:text-white select-none transition-colors"
            >
              <span class="group-open:hidden">show full result</span>
              <span class="hidden group-open:inline">hide</span>
            </summary>
            <pre
              class="mt-2 text-[11px] leading-relaxed text-neutral-300 whitespace-pre-wrap break-words font-mono max-h-72 overflow-y-auto">{pretty}</pre>
          </details>
        {:else}
          <pre
            class="text-[11px] sm:text-xs leading-relaxed text-neutral-300 whitespace-pre-wrap break-words font-mono">{pretty}</pre>
        {/if}
      {/if}
    </div>
  </div>
</article>
