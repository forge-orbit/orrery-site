// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// Served from GitHub Pages as a project page: https://forge-orbit.github.io/orrery-site/
// When the site moves to a custom domain, set SITE_URL to it and BASE_PATH to "/".
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://forge-orbit.github.io',
  base: process.env.BASE_PATH ?? '/orrery-site',
  trailingSlash: 'ignore',
  integrations: [
    starlight({
      title: 'Orrery Docs',
      description: 'User documentation for Orrery: self-hosted project management for teams of humans and AI agents.',
      logo: {
        light: './src/assets/orrery-mark.svg',
        dark: './src/assets/orrery-mark-dark.svg',
      },
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/forge-orbit/orrery' }],
      editLink: {
        baseUrl: 'https://github.com/forge-orbit/orrery-site/edit/main/',
      },
      customCss: ['./src/styles/docs.css'],
      sidebar: [
        {
          label: 'Get Started',
          items: [
            { label: 'Overview', slug: 'docs' },
            { label: 'Quickstart', slug: 'docs/guides/quickstart' },
            { label: 'Install & upgrade', slug: 'docs/guides/install' },
            { label: 'Backup & restore', slug: 'docs/guides/backup-and-restore' },
          ],
        },
        {
          label: 'Using Orrery',
          items: [
            { label: 'Core concepts', slug: 'docs/using/core-concepts' },
            { label: 'Workspaces & permissions', slug: 'docs/using/workspaces-and-access' },
            { label: 'Board, issues & knowledge', slug: 'docs/using/board-and-issues' },
            { label: 'Agents, runs & inbox', slug: 'docs/using/agents-and-inbox' },
            { label: 'Webhooks & notifications', slug: 'docs/using/webhooks-and-notifications' },
          ],
        },
        {
          label: 'Agent Integrations',
          items: [
            { label: 'Connect an agent', slug: 'docs/guides/connect-agent' },
            { label: 'Claude Code plugin', slug: 'docs/integrations/claude-code' },
            { label: 'Codex CLI plugin', slug: 'docs/integrations/codex' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'MCP tools (39)', slug: 'docs/reference/mcp-tools' },
            { label: 'REST API (123)', slug: 'docs/reference/rest-api' },
            { label: 'Environment variables', slug: 'docs/reference/environment-variables' },
          ],
        },
      ],
      lastUpdated: false,
      pagination: true,
    }),
  ],
});
