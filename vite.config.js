import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pluginRegistryPlugin, { getExternalAliases } from './vite-plugin-registry.js'
import { config as loadDotenv } from 'dotenv'
import { resolve } from 'path'

// Load server-side secrets so the dev proxy can inject them (e.g. WebSocket headers).
// These are never embedded in the client bundle — only used by the Vite dev server process.
loadDotenv({ path: resolve(import.meta.dirname, 'server/.env') })

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    pluginRegistryPlugin(),
  ],
  optimizeDeps: {
    // Scan all plugin source files so Vite auto-discovers and pre-bundles their
    // CJS deps (scheduler, use-sync-external-store, etc.) before serving them.
    // Without this Vite serves those CJS files raw via @fs/ and they fail in ESM.
    entries: [
      'src/**/*.{js,jsx}',
      '../demo-*/src/**/*.{js,jsx}',
    ],
  },
  resolve: {
    alias: {
      // Auto-discovers all demo-* siblings with a plugin.json.
      // To add a new external plugin: git submodule add <url> demo-<name>
      // No changes needed here.
      ...getExternalAliases(import.meta.dirname),
    },
    // Only dedupe packages actually installed in root node_modules.
    dedupe: [
      'react', 'react-dom', 'react/jsx-runtime',
      'three',
    ],
  },
  build: {
    target: 'es2022',           // output moderno — sin transpilación innecesaria
    modulePreload: { polyfill: false }, // quiosco = browsers modernos, no necesita polyfill
    rollupOptions: {
      output: {
        // Explicit vendor chunks so shared libs end up in one file regardless of
        // which node_modules they resolve from (main project vs plugin submodules).
        // This also gives stable filenames → better CDN/browser caching.
        manualChunks(id) {
          if (id.includes('/node_modules/three/'))          return 'vendor-three'
          if (id.includes('/node_modules/@react-three/'))   return 'vendor-r3f'
          if (id.includes('/node_modules/zustand/'))        return 'vendor-store'
          if (id.includes('/node_modules/zod/'))            return 'vendor-store'
          if (id.includes('/node_modules/lucide-react/'))   return 'vendor-ui'
        },
      },
    },
  },
  server: {
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.PORT ?? 3001}`,
        changeOrigin: true,
      },
      '/reports': {
        target: `http://localhost:${process.env.PORT ?? 3001}`,
        changeOrigin: true,
      },
      '/report': {
        target: `http://localhost:${process.env.PORT ?? 3001}`,
        changeOrigin: true,
      },
      // WebSocket TTS — browsers can't set Authorization on WS upgrades,
      // so the dev server proxies it and injects the key server-side.
      '/ws-tts': {
        target: 'wss://api.x.ai',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws-tts/, '/v1/tts'),
        headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}` },
      },
    },
  },
  preview: {
    historyApiFallback: true,
  },
}))