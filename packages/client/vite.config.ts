// vite.config.ts
import { defineConfig } from 'vite';
import { transform } from '@swc/core';

export default defineConfig({
  esbuild: false,
  optimizeDeps: {
    include: ['ol', 'redux', 'react-redux'],
  },
  build: {
    target: 'es2018',
  },
  resolve: {
    alias: {
      '@swc/core': '@swc/core',
    },
  },
  plugins: [
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
              target: 'es2018',
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
