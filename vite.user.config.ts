import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/user',
  build: {
    outDir: '../../dist/user',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
