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
  plugins: [react(), pluginRegistryPlugin()],
  resolve: {
    alias: {
      // Auto-discovers all demo-* siblings with a plugin.json.
      // To add a new external plugin: git submodule add <url> demo-<name>
      // No changes needed here.
      ...getExternalAliases(import.meta.dirname),
    },
    // Force a single React instance even though plugins have their own.
    // Without this, Zustand hooks and React context break across the boundary.
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
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