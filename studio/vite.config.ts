import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cortisApiPlugin } from './server/vitePlugin.js'

const studioRoot = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(studioRoot, '..')

export default defineConfig({
  root: studioRoot,
  envDir: projectRoot,
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  base: '/studio/',
  plugins: [react(), tailwindcss(), cortisApiPlugin()],
  build: {
    outDir: path.resolve(projectRoot, 'public/studio'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/auth': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  preview: {
    port: 4173,
  },
})
