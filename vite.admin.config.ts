import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/admin',
  build: {
    outDir: '../../dist/admin',
    emptyOutDir: true,
  },
  server: {
    port: 4000,
    open: true,
  },
});
