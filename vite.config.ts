import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** e.g. GitHub Pages: `BASE_PATH=/repo-name/ npm run build` */
function appBase(): string {
  const raw = process.env.BASE_PATH
  if (raw == null || raw === '' || raw === '/') {
    return '/'
  }
  return raw.endsWith('/') ? raw : `${raw}/`
}

// https://vite.dev/config/
export default defineConfig({
  base: appBase(),
  plugins: [react()],
  build: {
    // Three.js in its own async chunk; ~500kB+ for that file is expected.
    chunkSizeWarningLimit: 650,
  },
  server: {
    // Listen on all interfaces (LAN / device testing; mic still needs HTTPS on non-localhost)
    host: true,
  },
})
