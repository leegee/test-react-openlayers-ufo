// vite.config.ts
import path from 'path';
import { defineConfig } from 'vite';
import macros from 'unplugin-parcel-macros';
import { transform } from '@swc/core';
import { VitePWA } from 'vite-plugin-pwa';

const apiUrl = process.env.VERCEL_URL ?? process.env.VITE_API_URL ?? 'localhost:3000';

console.info('API URL set to', apiUrl);

export default defineConfig({
  base: './',
  esbuild: false,
  build: {
    target: 'es2020',
    outDir: 'build/',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'ol'],
        },
      },
    },
  },
  define: {
    'process.env': process.env,
    'import.meta.env.VITE_VERCEL_URL': JSON.stringify(apiUrl),
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

    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'UFO App',
        short_name: 'UFOs',
        theme_color: '#ffffff',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        icons: [
          {
            "src": "icons/manifest-icon-192.maskable.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "icons/manifest-icon-192.maskable.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "maskable"
          },
          {
            "src": "icons/manifest-icon-512.maskable.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "icons/manifest-icon-512.maskable.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
          }
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,json,png}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
        runtimeCaching: [
          {
            urlPattern: new RegExp(apiUrl),
            handler: 'CacheFirst',
            options: {
              cacheName: 'openlayers-api-cache',
              expiration: {
                maxAgeSeconds: 30 * 24 * 60 * 60, // Cache for 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },

    }),
  ],
});
