import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pluginRegistryPlugin, { getExternalAliases } from './vite-plugin-registry.js'

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
}))