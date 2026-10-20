import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  envDir: path.resolve(__dirname, '..'),
  envPrefix: ['VITE_', 'GOOGLE_'],
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@metalsense/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  // @ts-expect-error vitest options
  test: {
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/e2e/**', '**/node_modules/**', '**/dist/**'],
  },
});
