/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set the base to './' for relative paths in the built output,
  // which is important for Electron.
  base: './',
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
