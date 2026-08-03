import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import ViteYaml from '@modyfi/vite-plugin-yaml'

// Two build targets share this config:
//   `vite build`            → the Svelte dashboard SPA (future GitHub Pages site)
//   `vite build --mode lib` → the publishable stats library (dist/index.js, ES module)
// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    ViteYaml(),
    tailwindcss(),
    svelte()
  ],
  build: mode === 'lib'
    ? {
        lib: {
          entry: 'src/index.js',
          formats: ['es'],
          fileName: 'index'
        },
        outDir: 'dist',
        // tsc writes the .d.ts files into dist after vite; vite must not wipe them,
        // so vite runs first (see the build:lib script order).
        emptyOutDir: true,
        sourcemap: true
      }
    : {}
}))
