import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://pointoflucas.github.io',
  base: '/mustafabarak',
  output: 'static',
  integrations: [],
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
  vite: {
    ssr: {
      external: ['svgo']
    }
  }
});
