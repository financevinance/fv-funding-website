// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Change `site` if the website moves to another domain.
export default defineConfig({
  site: 'https://financevinance.com',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  integrations: [sitemap({ filter: (page) => !page.includes('/book/thanks') })],
});
