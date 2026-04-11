import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/notion-rss-reader/' : './',
  build: {
    outDir: '../.dist',
  },
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
}));
