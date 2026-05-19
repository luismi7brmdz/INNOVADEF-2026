import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Allows importing AeroCognitio plugin from the sibling repo.
      // Both repos must live on the same machine/server at the same directory level.
      '@aerocognitio': path.resolve(__dirname, '../../demoinnovadef/src'),
    },
    // Force a single React instance even though both repos have it installed.
    // Without this, Zustand hooks and React context break across the boundary.
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
})