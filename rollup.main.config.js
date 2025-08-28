import { defineConfig } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';

export default defineConfig({
  input: 'main.js',
  output: {
    file: 'dist/main.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    nodeResolve({
      preferBuiltins: true,
      browser: false
    }),
    commonjs(),
    json()
  ],
  external: [
    'electron',
    'keytar',
    'playwright',
    'fs',
    'path',
    'url',
    'child_process',
    'os',
    'util',
    'crypto',
    'stream',
    'buffer',
    'assert',
    'events',
    'vm',
    'module',
    'constants',
    'string_decoder',
    'timers',
    'console',
    'process'
  ]
});