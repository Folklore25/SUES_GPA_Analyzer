import { defineConfig } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default defineConfig({
  input: 'frontend/src/main.jsx',
  output: {
    dir: 'dist/frontend',
    format: 'esm',
    sourcemap: true,
    entryFileNames: '[name].[hash].js',
    chunkFileNames: '[name].[hash].js'
  },
  plugins: [
    nodeResolve({
      browser: true,
      extensions: ['.js', '.jsx']
    }),
    commonjs(),
    json()
  ],
  external: [
    'react',
    'react-dom',
    '@mui/material',
    '@emotion/react',
    '@emotion/styled',
    'echarts',
    'echarts-for-react'
  ]
});