#!/usr/bin/env node
// Pull the product docs into the site before dev and build.
//
// Product docs are written in forge-orbit/orrery under docs/, next to the code. This script
// copies them to src/content/docs/docs/ so Starlight serves them at /docs/. If the main repo
// has no docs/ folder yet, it copies docs-placeholder/ instead.
//
// Environment:
//   DOCS_SOURCE  Path to a local checkout of forge-orbit/orrery. Skips the clone (handy in dev).
//   DOCS_REPO    Git URL to clone. Default: https://github.com/forge-orbit/orrery.git
//   DOCS_REF     Branch or tag to clone. Default: main
//   BASE_PATH    Same as astro.config.mjs. Used to rewrite links between docs pages.
//
// Folders under docs/ that are for contributors' tools or non-page specs, not readers, are never
// published (see `internal` below).
//
// On CI (CI=true) a failed clone fails the build, so a network problem can't silently
// publish the placeholder. A clone that works but has no docs/ falls back to the placeholder.

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'src/content/docs/docs');
const placeholder = join(root, 'docs-placeholder');

const repo = process.env.DOCS_REPO ?? 'https://github.com/forge-orbit/orrery.git';
const ref = process.env.DOCS_REF ?? 'main';
const base = (process.env.BASE_PATH ?? '/orrery-site').replace(/\/$/, '');
const repoWebBase = 'https://github.com/forge-orbit/orrery';
const editBase = `${repoWebBase}/edit/${ref}/docs/`;
const blobBase = `${repoWebBase}/blob/${ref}/`;
const isMarkdown = (f) => /\.(md|mdx)$/i.test(f);

// Top-level folders in docs/ that stay in the repo but never reach the website.
// agents/: configuration that coding agents read (issue tracker, triage labels, domain docs).
// formal/: TLA+ models (.tla/.cfg), not Starlight Markdown pages.
const internal = ['agents', 'formal'];
const isPublished = (rel) => !internal.includes(rel.split('/')[0]);

function log(msg) {
  console.log(`[sync-docs] ${msg}`);
}

/** Returns the path of an upstream docs/ folder, or null if there isn't one. */
function findUpstream() {
  if (process.env.DOCS_SOURCE) {
    const dir = resolve(process.env.DOCS_SOURCE, 'docs');
    log(`using local checkout ${process.env.DOCS_SOURCE}`);
    return existsSync(dir) ? dir : null;
  }

  const cloneDir = join(mkdtempSync(join(tmpdir(), 'orrery-docs-')), 'orrery');
  try {
    const git = (...args) => execFileSync('git', args, { stdio: 'pipe' });
    git('clone', '--depth=1', '--filter=blob:none', '--sparse', '--branch', ref, repo, cloneDir);
    git('-C', cloneDir, 'sparse-checkout', 'set', 'docs');
  } catch (err) {
    const detail = err.stderr?.toString().trim() || err.message;
    if (process.env.CI) {
      throw new Error(`could not clone ${repo}@${ref}: ${detail}`);
    }
    log(`could not clone ${repo}@${ref}, using the placeholder (${detail.split('\n').pop()})`);
    return null;
  }
  const dir = join(cloneDir, 'docs');
  return existsSync(dir) ? dir : null;
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/** Page URL for a docs file path relative to docs/, e.g. "guides/install.md" -> "/orrery-site/docs/guides/install/". */
function pageUrl(rel) {
  let slug = rel.replace(/\.(md|mdx)$/i, '').toLowerCase();
  slug = slug.replace(/(^|\/)(index|readme)$/, '');
  return `${base}/docs/${slug}${slug ? '/' : ''}`;
}

/**
 * Make a plain Markdown file from the main repo work as a Starlight page:
 * - README.md becomes the section index,
 * - a missing `title` comes from the first "# Heading",
 * - "Edit page" points at the file in forge-orbit/orrery,
 * - relative links to other .md files point at their pages (or GitHub if outside published docs/).
 */
function adapt(text, rel) {
  let front = '';
  let body = text;
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (m) {
    front = m[1];
    body = text.slice(m[0].length);
  }

  if (!/^title\s*:/m.test(front)) {
    const h1 = body.match(/^#\s+(.+?)\s*#*\s*$/m);
    const name = rel.replace(/\.(md|mdx)$/i, '').split('/').pop().replace(/[-_]+/g, ' ');
    const title = h1 ? h1[1] : name.charAt(0).toUpperCase() + name.slice(1);
    if (h1) body = body.replace(h1[0], '').replace(/^\s*\n/, '');
    front = [`title: ${JSON.stringify(title)}`, front].filter(Boolean).join('\n');
  }
  if (!/^editUrl\s*:/m.test(front)) {
    front += `\neditUrl: ${JSON.stringify(editBase + rel)}`;
  }

  const fromDir = posix.dirname(rel);
  body = body.replace(/\]\((?!https?:|mailto:|#|\/)([^)\s]+?)(#[^)\s]*)?\)/gi, (full, target, hash = '') => {
    const resolved = posix.normalize(posix.join(fromDir, target));
    if (resolved.startsWith('../')) {
      const repoPath = resolved.replace(/^(\.\.\/)+/, '');
      return `](${blobBase}${repoPath}${hash})`;
    }
    if (!isPublished(resolved)) {
      return `](${blobBase}docs/${resolved}${hash})`;
    }
    if (isMarkdown(resolved)) {
      return `](${pageUrl(resolved)}${hash})`;
    }
    return full;
  });

  return `---\n${front.trim()}\n---\n\n${body}`;
}

function copyUpstream(src) {
  for (const file of walk(src)) {
    const rel = relative(src, file).split('\\').join('/');
    if (!isPublished(rel)) continue;
    let destRel = rel.replace(/(^|\/)README\.md$/i, '$1index.md');
    const dest = join(out, destRel);
    mkdirSync(dirname(dest), { recursive: true });
    if (isMarkdown(rel)) {
      writeFileSync(dest, adapt(readFileSync(file, 'utf8'), rel));
    } else {
      cpSync(file, dest);
    }
  }
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const upstream = findUpstream();
if (upstream && walk(upstream).some((f) => isPublished(relative(upstream, f).split('\\').join('/')) && isMarkdown(f))) {
  copyUpstream(upstream);
  log(`copied docs from ${process.env.DOCS_SOURCE ?? `${repo}@${ref}`}`);
} else {
  cpSync(placeholder, out, { recursive: true });
  log('the main repo has no docs/ yet, using docs-placeholder/');
}
