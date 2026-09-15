# Personal Website

A minimal personal website built with Astro, TypeScript, and plain CSS.

## Quick Start

### Install and Run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to see your site locally.

### Build

```bash
npm run build
npm run preview  # Preview the production build
```

## Configuration

Update your personal information in `src/data/site.ts`:

```typescript
export const site = {
  name: 'Your Name',
  shortDescription: 'Your description here',
  email: 'your-email@example.com',
  github: 'https://github.com/yourusername',
  linkedin: 'https://linkedin.com/in/yourusername',
  siteUrl: 'https://yourdomain.com',  // Update for custom domain
};
```

## Adding Content

### Add a Project

1. Create a new file: `src/content/projects/project-name.md`

2. Use this template:

```markdown
---
title: "Project Title"
description: "Short description of the project."
year: 2024
tags:
  - Tag1
  - Tag2
featured: true
---

Project details and content here.
```

- `featured: true` shows it on the homepage
- `link` field is optional for projects

### Add an Article

1. Create a new file: `src/content/writing/article-name.md`

2. Use this template:

```markdown
---
title: "Article Title"
description: "Short description."
date: 2024-09-15
tags:
  - AI
  - Engineering
draft: false
---

Article content here.
```

- `draft: true` hides unpublished articles
- Articles automatically sort by date (newest first)

### Add Recommendations

Edit `src/data/recommendations.ts` and add to the array:

```typescript
{
  title: 'Book Title',
  creator: 'Author Name',
  category: 'book',  // 'book', 'movie', 'music', 'article', 'tool', 'other'
  year: 2024,
  note: 'Why I recommend it',
  link: 'https://...'  // optional
}
```

### Update Current Interests

Edit `src/data/now.ts` to change what you're currently interested in:

```typescript
export const currentInterests = [
  "First interest",
  "Second interest",
  // ...
];
```

## Deployment

### GitHub Pages

1. Update the repository name in astro.config.mjs if needed
2. Push to GitHub
3. Enable GitHub Pages in Settings → Pages → Deploy from a branch
4. Select `gh-pages` branch

The workflow file at `.github/workflows/deploy.yml` handles automatic deployment on push to main.

### Vercel or Netlify

These work without changes:

**Vercel:** Connect your GitHub repo, no configuration needed.

**Netlify:** Connect your GitHub repo, set build command to `npm run build` and publish directory to `dist`.

## Project Structure

```
src/
  components/       # Reusable components
  content/
    projects/       # Project markdown files
    writing/        # Article markdown files
    config.ts       # Content collections config
  data/
    site.ts         # Site config and navigation
    experience.ts   # Experience data
    recommendations.ts  # Recommendations data
    now.ts          # Current interests
  layouts/          # Page layouts
  pages/            # Page routes
  styles/           # Global CSS
public/             # Static files
astro.config.mjs    # Astro configuration
```

## Design

The site uses:
- Clean typography
- Minimal, restrained styling
- Responsive design (mobile-friendly)
- Dark mode support (respects `prefers-color-scheme`)
- No frameworks, no dependencies beyond Astro

## Content Tips

- Keep writing concise and clear
- Use markdown formatting for readability
- Projects can link to repos or live demos (optional)
- Dates and years help provide context
- Tags organize content

## That's It

The site is completely static and requires no backend, database, or API. Everything is built from markdown files and configuration.

Edit files, push to GitHub, and your site deploys automatically.

## License

MIT
