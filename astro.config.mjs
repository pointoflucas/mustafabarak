import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mustafabarak.github.io',
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
