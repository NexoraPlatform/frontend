import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      { find: '@/locales', replacement: path.resolve(__dirname, 'messages') },
      { find: '@', replacement: path.resolve(__dirname, '.') },
    ],
  },
  build: {
    target: 'esnext', // sau 'es2017', 'es2018' etc, evită transpiling inutil
  },
  test: {
    environment: 'jsdom',
  },
});
