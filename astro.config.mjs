// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Change `site` if the website moves to another domain.
export default defineConfig({
  site: 'https://financevinance.com',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  // Keep every script as a separate file (no inline scripts) so the strict CSP in Base.astro works.
  vite: { build: { assetsInlineLimit: 0 } },
  integrations: [sitemap({ filter: (page) => !page.includes('/book/thanks') })],
});
