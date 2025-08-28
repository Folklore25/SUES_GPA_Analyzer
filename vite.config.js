/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set the base to './' for relative paths in the built output,
  // which is important for Electron.
  base: './',
  build: {
    rollupOptions: {
      external: ['jsdom'], // 将jsdom标记为外部依赖，因为它在浏览器环境中不适用
      output: {
        manualChunks: {
          // 将MUI相关库打包到单独的chunk中
          'mui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          // 将ECharts相关库打包到单独的chunk中
          'echarts': ['echarts', 'echarts-for-react'],
          // 将React相关库打包到单独的chunk中
          'react': ['react', 'react-dom'],
          // 将工具库打包到单独的chunk中
          'utils': ['mathjs']
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Increase the chunk size warning limit to 1000kb
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})