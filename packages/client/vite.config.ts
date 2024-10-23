// vite.config.ts
import path from 'path';
import { defineConfig } from 'vite';
import macros from 'unplugin-parcel-macros';
import { transform } from '@swc/core';

export default defineConfig({
  esbuild: false,
  optimizeDeps: {
    include: ['ol', 'redux', 'react-redux'],
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  define: {
    'process.env': process.env,
  },
  resolve: {
    alias: {
      '@swc/core': '@swc/core',
      '@ufo-monorepo/config': path.resolve(__dirname, '../config/src'),
      '@ufo-monorepo/common-types': path.resolve(__dirname, '../common-types/src')
    },
  },
  plugins: [
    macros.vite(),
    {
      name: 'swc',
      enforce: 'pre',
      async transform(code, id) {
        if (id.endsWith('.tsx') || id.endsWith('.ts')) {
          const transformed = await transform(code, {
            filename: id,
            sourceMaps: true,
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              target: 'es2020',
            },
          });

          return {
            code: transformed.code,
            map: transformed.map,
          };
        }
      },
    },
  ],
});
