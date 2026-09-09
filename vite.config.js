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
  resolve: {
    // The base44 vite plugin used to provide this alias; it's ours now.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
