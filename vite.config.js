import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Each plugin lives as a submodule of innovadef-demos (sibling of this repo).
      // To add a plugin: git submodule add <url> in innovadef-demos, then add an entry to registry.js.
      '@aerocognitio': path.resolve(__dirname, '../demo-aerocognitio/src'),
    },
    // Force a single React instance even though both repos have it installed.
    // Without this, Zustand hooks and React context break across the boundary.
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
})