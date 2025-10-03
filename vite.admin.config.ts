import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/admin',
  envDir: '../..', // Load environment variables from project root
  build: {
    outDir: '../../dist/admin',
    emptyOutDir: true,
  },
  server: {
    port: 4000,
    open: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../..'),
    },
  },
});
