import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA:可装手机主屏、离线可用。数据全程存本机 localStorage,不联网。
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '在港天数 · 港漂全家打卡',
        short_name: '在港天数',
        description: '全家出入境打卡,续签与税务自查。数据仅存本机,不上传。',
        theme_color: '#111827',
        background_color: '#f6f6f5',
        display: 'standalone',
        lang: 'zh-Hant',
        start_url: '/',
        // 用单个 SVG 图标(现代浏览器 manifest 支持)。后续要更广覆盖可补 192/512 PNG。
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
