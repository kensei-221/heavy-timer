import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'gong-start.mp3'],
      workbox: {
        // 既定のプリキャッシュ対象に加え、開始音MP3もオフライン用にキャッシュする
        globPatterns: ['**/*.{js,css,html,ico,svg,mp3}'],
      },
      manifest: {
        name: 'Heavy Timer',
        short_name: 'HeavyTimer',
        description: 'Professional Training Timer with Molten UX0020 Sound',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
