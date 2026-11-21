<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/orrery-mark-dark.svg">
    <img src="assets/orrery-mark.svg" alt="Orrery" width="80">
  </picture>
</p>

<h1 align="center">Orrery website</h1>

<p align="center">
  The landing page for <a href="https://github.com/forge-orbit/orrery">Orrery</a>:
  self-hosted project management for teams of humans and AI agents.
</p>

<p align="center"><em>Status: live for the Orrery MVP (v0.1.1). Served from GitHub Pages; no custom domain yet.</em></p>

---

## What lives here

- **The landing page**: what Orrery is, how agents and humans work together on one board, and how to self-host and connect agents.
- **The docs site (`/docs/`)**: product guides, ADRs, and design docs live in the main repo under
  [`docs/`](https://github.com/forge-orbit/orrery/tree/main/docs), next to the code they describe,
  and are pulled in here at build time.

The product code, roadmap and design discussions live in
[forge-orbit/orrery](https://github.com/forge-orbit/orrery).

## Develop

Needs Node 22.23.4 or later.

```sh
npm install
npm run dev       # http://localhost:4321/orrery-site/ (docs at /orrery-site/docs/)
npm run build     # static output in dist/
npm run preview   # serve the build locally
```

Page copy that describes the product (features, MCP tools, milestones and links) lives in
[`src/data/site.ts`](src/data/site.ts).

```
src/
  pages/index.astro      the landing page, one component per section
  components/            Header, Hero, Problem, HowItWorks, Features, Architecture,
                         Integrations, SelfHosted, Roadmap, GetInvolved, Footer
  data/site.ts           product copy and links to forge-orbit/orrery
  styles/global.css      design tokens (colors from the logo, type, spacing)
  content.config.ts      Starlight docs collection
public/                  favicon and logo marks
scripts/sync-docs.mjs    copies docs/ from forge-orbit/orrery before dev and build
docs-placeholder/        fallback docs if upstream docs/ is unavailable
```

## Docs

The docs at `/docs/` are built with [Starlight](https://starlight.astro.build). The pages are not
written here: they live in [forge-orbit/orrery](https://github.com/forge-orbit/orrery) under `docs/`,
next to the code. Before every `dev` and `build`,
[`scripts/sync-docs.mjs`](scripts/sync-docs.mjs) clones that folder and copies it to
`src/content/docs/docs/` (generated, not committed), excluding internal `docs/agents/` and
`docs/formal/` directories. Plain GitHub-style Markdown works: a `# Heading` becomes the page
title, `README.md` becomes a folder's index, relative `.md` links are rewritten to page URLs, and
links escaping `docs/` are rewritten to GitHub blob URLs.

| Variable | Use |
| --- | --- |
| `DOCS_SOURCE=../orrery` | Use a local checkout instead of cloning, to preview docs changes |
| `DOCS_REPO`, `DOCS_REF` | Clone another repo or branch (default: forge-orbit/orrery, `main`) |

On CI a failed clone fails the build, so a network problem can't publish the placeholder by mistake.

## Deploy

Every push to `main` builds the site and publishes it to GitHub Pages at
<https://forge-orbit.github.io/orrery-site/> (see
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). Pull requests build only. The
workflow also listens for a `docs-updated` repository dispatch sent by `forge-orbit/orrery` when its
`docs/` change.

The site is built for the `/orrery-site/` path. When it moves to a custom domain, set
`SITE_URL` to the domain and `BASE_PATH` to `/` (see [`astro.config.mjs`](astro.config.mjs)).

## Decided

- Stack: [Astro](https://astro.build), static output.
- Hosting: GitHub Pages for now.
- No waitlist. Calls to action point to GitHub and the design discussion.
- Design: light-first "instrument" style with a dark mode. Ink `#14161B`, cream `#F6F3EC`,
  accent `#F2561D`. Instrument Serif for headings, Inter for text, JetBrains Mono for code.

Still open: the domain, which will be bought later. Until then the site stays a project page (no
repo rename). See the issues labeled `need discussion`.

## License

MIT. See [LICENSE](LICENSE).
