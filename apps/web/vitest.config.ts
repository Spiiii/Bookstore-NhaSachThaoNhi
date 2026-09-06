import { defineConfig } from 'vitest/config';
export default defineConfig({
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx', 'tests/news-seo.spec.ts'],
  },
});
