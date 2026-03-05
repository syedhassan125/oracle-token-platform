import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: resolve(__dirname, 'node_modules/buffer/index.js'),
      stream: resolve(__dirname, 'node_modules/stream-browserify/index.js'),
      crypto: resolve(__dirname, 'node_modules/crypto-browserify/index.js'),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      define: {
        global: 'globalThis',
      },
    },
    include: ['buffer', 'stream-browserify', 'crypto-browserify'],
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
