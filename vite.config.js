import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  // base44 set this to 'error', which also swallowed Vite's startup banner —
  // `npm run dev` printed nothing at all, so it looked like it had failed.
  // Developers need to see the URL it's serving on.
  logLevel: 'info',
  plugins: [react()],
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
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
