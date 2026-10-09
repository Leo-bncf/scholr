import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
// `npm run dev:fake` swaps the Supabase client for an in-memory one seeded with
// an invented school (dev/fake-backend/). The only Supabase project is
// production, so this is the safe place to click through unfinished screens.
// Serve-only: a build in this mode would ship fake auth, so it is refused.
export default defineConfig(({ mode, command }) => {
  const fake = mode === 'fake';
  if (fake && command === 'build') throw new Error('--mode fake is for the dev server only; never build with it.');
  return {
  // base44 set this to 'error', which also swallowed Vite's startup banner —
  // `npm run dev` printed nothing at all, so it looked like it had failed.
  // Developers need to see the URL it's serving on.
  logLevel: 'info',
  plugins: [
    react(),
    fake && {
      name: 'scholr-fake-banner',
      transformIndexHtml: (html) => html.replace(
        '<body>',
        '<body><div style="position:fixed;bottom:8px;left:8px;z-index:9999;font:600 11px/1 ui-monospace,monospace;padding:6px 8px;border-radius:6px;background:#1d3b2a;color:#fff;opacity:.85;pointer-events:none">FAKE DATA · dev:fake</div>',
      ),
    },
  ],
  build: {
    /* No manualChunks.
       Forcing react/react-dom into their own chunk produced
       "Cannot read properties of undefined (reading 'forwardRef')" — a blank
       page: the vendor chunk initialised before React had finished, which is
       the standard hazard of hand-splitting a framework out of its dependents.
       And an object-form `{ charts: ['recharts'] }` made the chunk a static
       dependency of the entry, so every visitor downloaded 421 kB of charting.

       Route-level lazy loading is doing the work instead: recharts is only
       reached from pages that draw a chart, so Rollup already places it in a
       chunk nobody else loads. */
    chunkSizeWarningLimit: 900,
  },
  resolve: {
    // The base44 vite plugin used to provide this alias; it's ours now.
    alias: [
      ...(fake ? [{ find: /^@\/lib\/supabase$/, replacement: fileURLToPath(new URL('./dev/fake-backend/supabase.js', import.meta.url)) }] : []),
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
  },
  };
});
