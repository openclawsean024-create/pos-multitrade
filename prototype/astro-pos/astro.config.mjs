import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://pos-multitrade.vercel.app',
  output: 'static',
  build: {
    format: 'directory',
  },
});
