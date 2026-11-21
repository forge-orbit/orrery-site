#!/usr/bin/env node
// Generate machine-verified Reference docs (MCP tools & REST API) from forge-orbit/orrery/contract/.
//
// User-facing guides live in src/content/docs/docs/ inside this repo. Before every `dev` and
// `build`, this script pulls contract/mcp-tools.json and contract/openapi.json from
// forge-orbit/orrery so the Reference section never drifts from the shipped server.
//
// Environment:
//   DOCS_SOURCE  Path to a local checkout of forge-orbit/orrery. Skips the clone (handy in dev).
//   DOCS_REPO    Git URL to clone. Default: https://github.com/forge-orbit/orrery.git
//   DOCS_REF     Branch or tag to clone. Default: main

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const refOut = join(root, 'src/content/docs/docs/reference');
const repo = process.env.DOCS_REPO ?? 'https://github.com/forge-orbit/orrery.git';
const ref = process.env.DOCS_REF ?? 'main';
const repoWebBase = 'https://github.com/forge-orbit/orrery';

function log(msg) {
  console.log(`[sync-docs] ${msg}`);
}

function findContractDir() {
  if (process.env.DOCS_SOURCE) {
    const dir = resolve(process.env.DOCS_SOURCE, 'contract');
    log(`using local contracts from ${process.env.DOCS_SOURCE}`);
    return existsSync(dir) ? dir : null;
  }

  const cloneDir = join(mkdtempSync(join(tmpdir(), 'orrery-contract-')), 'orrery');
  try {
    const git = (...args) => execFileSync('git', args, { stdio: 'pipe' });
    git('clone', '--depth=1', '--filter=blob:none', '--sparse', '--branch', ref, repo, cloneDir);
    git('-C', cloneDir, 'sparse-checkout', 'set', 'contract');
  } catch (err) {
    const detail = err.stderr?.toString().trim() || err.message;
    if (process.env.CI) {
      throw new Error(`could not clone ${repo}@${ref}: ${detail}`);
    }
    log(`could not clone ${repo}@${ref} (${detail.split('\n').pop()})`);
    return null;
  }
  const dir = join(cloneDir, 'contract');
  return existsSync(dir) ? dir : null;
}

const escCell = (s) =>
  String(s ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n+/g, ' ')
    .trim();

function formatSchemaType(prop) {
  if (!prop || typeof prop !== 'object') return 'any';
  if (Array.isArray(prop.enum)) {
    return prop.enum.map((v) => `\`${JSON.stringify(v)}\``).join(' \\| ');
  }
  if (Array.isArray(prop.anyOf)) {
    return prop.anyOf.map(formatSchemaType).join(' \\| ');
  }
  if (prop.type === 'array') {
    return `array<${formatSchemaType(prop.items)}>`;
  }
  if (Array.isArray(prop.type)) {
    return prop.type.join(' \\| ');
  }
  return prop.type ?? (prop.$ref ? prop.$ref.split('/').pop() : 'object');
}

const MCP_GROUPS = [
  {
    title: 'Projects & knowledge',
    description: 'Discover accessible projects in the API key scope and read or update project-scoped Markdown knowledge.',
    names: ['list_projects', 'get_project', 'list_knowledge', 'get_knowledge', 'create_knowledge', 'update_knowledge'],
  },
  {
    title: 'Issues, labels, dependencies & comments',
    description: 'Create and manage issues, one-level subtasks, project labels, acyclic `blocked_by` edges, comments, and PR/commit/doc links.',
    names: [
      'list_issues',
      'get_issue',
      'create_issue',
      'update_issue',
      'list_labels',
      'create_label',
      'update_label',
      'delete_label',
      'attach_issue_label',
      'detach_issue_label',
      'add_blocked_by',
      'remove_blocked_by',
      'list_blocked_by',
      'list_blocking',
      'list_comments',
      'create_comment',
      'add_issue_link',
      'remove_issue_link',
    ],
  },
  {
    title: 'Work sessions & telemetry',
    description: 'Pull ready work, hold five-minute atomic Claim leases, stream durable progress or ephemeral sidecar activity, and hand off for review.',
    names: [
      'ready_work',
      'claim_issue',
      'renew_claim',
      'report_progress',
      'log_session_activity',
      'get_work_session',
      'list_work_sessions',
      'resume_work_session',
      'reacquire_issue',
      'stop_session',
      'list_session_activities',
      'list_activity',
    ],
  },
  {
    title: 'Needs-input inbox',
    description: 'Open blocking questions with a proposed fallback and inspect human replies or one-hour timeout dispositions.',
    names: ['ask_for_input', 'list_issue_questions'],
  },
  {
    title: 'Runs & harness check-in',
    description: 'Register or update an active Harness run with model and version metadata.',
    names: ['orrery_run_checkin'],
  },
];

function renderMcpTools(tools) {
  const byName = new Map(tools.map((t) => [t.name, t]));
  const used = new Set();
  const lines = [
    '---',
    'title: "MCP tools reference"',
    `description: "Complete reference for all ${tools.length} MCP tools served at /mcp, generated directly from forge-orbit/orrery."`,
    `editUrl: "${repoWebBase}/blob/${ref}/contract/mcp-tools.json"`,
    '---',
    '',
    `Orrery exposes **${tools.length} MCP tools** over Streamable HTTP at \`POST /mcp\`. Every call authenticates with a workspace-scoped agent API key (\`Authorization: Bearer <API key>\`) and is capped by the key owner's live project permissions.`,
    '',
    `> This page is generated automatically from [\`contract/mcp-tools.json\`](${repoWebBase}/blob/${ref}/contract/mcp-tools.json) at build time.`,
    '',
  ];

  const renderTool = (tool) => {
    used.add(tool.name);
    lines.push(`### \`${tool.name}\``, '');
    if (tool.description) {
      lines.push(tool.description.trim(), '');
    }
    const props = tool.inputSchema?.properties ?? {};
    const required = new Set(tool.inputSchema?.required ?? []);
    const entries = Object.entries(props);
    if (entries.length === 0) {
      lines.push('_No input parameters._', '');
      return;
    }
    lines.push('| Parameter | Type | Required | Description |');
    lines.push('| --- | --- | --- | --- |');
    for (const [key, schema] of entries) {
      const req = required.has(key) ? 'Yes' : 'No';
      const desc = escCell(schema.description ?? '');
      lines.push(`| \`${key}\` | ${formatSchemaType(schema)} | ${req} | ${desc} |`);
    }
    lines.push('');
  };

  for (const group of MCP_GROUPS) {
    const items = group.names.map((n) => byName.get(n)).filter(Boolean);
    if (items.length === 0) continue;
    lines.push(`## ${group.title}`, '', group.description, '');
    for (const tool of items) renderTool(tool);
  }

  const remaining = tools.filter((t) => !used.has(t.name));
  if (remaining.length > 0) {
    lines.push('## Other tools', '');
    for (const tool of remaining) renderTool(tool);
  }

  return lines.join('\n');
}

const REST_GROUPS = [
  { title: 'Health & first-run setup', prefixes: ['/healthz', '/readyz', '/api/setup'] },
  { title: 'Authentication & account', prefixes: ['/api/auth', '/api/account'] },
  { title: 'Workspaces, members, webhooks & invitations', prefixes: ['/api/workspaces', '/api/workspace-invitations', '/api/invitations', '/api/transfers'] },
  { title: 'Projects, labels & knowledge', prefixes: ['/api/projects', '/api/labels', '/api/knowledge'] },
  { title: 'Issues, work sessions & inbox', prefixes: ['/api/issues', '/api/inbox', '/api/questions'] },
  { title: 'Agents & runs', prefixes: ['/api/agents', '/api/runs'] },
  { title: 'My work & notifications', prefixes: ['/api/my-work', '/api/notifications'] },
  { title: 'Instance administration & settings', prefixes: ['/api/admin', '/api/settings', '/api/installation'] },
];

const METHOD_ORDER = ['get', 'post', 'put', 'patch', 'delete'];

function renderRestApi(openapi) {
  const paths = openapi.paths ?? {};
  const ops = [];
  for (const [path, methods] of Object.entries(paths)) {
    for (const method of METHOD_ORDER) {
      if (!methods[method]) continue;
      const op = methods[method];
      ops.push({
        method: method.toUpperCase(),
        path,
        summary: op.summary || op.description || '',
      });
    }
  }

  const lines = [
    '---',
    'title: "REST API reference"',
    `description: "Index of all ${ops.length} REST API operations across ${Object.keys(paths).length} endpoints in Orrery, generated from OpenAPI 3.1."`,
    `editUrl: "${repoWebBase}/blob/${ref}/contract/openapi.json"`,
    '---',
    '',
    `Orrery serves **${ops.length} REST operations** across **${Object.keys(paths).length} endpoints** alongside \`/mcp\`. Everything an agent can do over MCP is also available over REST.`,
    '',
    '- **Authentication:** Humans use session cookies from `/api/auth/login`; agents use `Authorization: Bearer <API key>`.',
    '- **Errors:** All error responses follow **RFC 9457 Problem Details** (`application/problem+json`) with a stable machine-readable `code`.',
    `- **OpenAPI 3.1 spec:** Generated automatically from [\`contract/openapi.json\`](${repoWebBase}/blob/${ref}/contract/openapi.json).`,
    '',
  ];

  const used = new Set();
  const renderTable = (items) => {
    lines.push('| Method | Path | Summary |');
    lines.push('| --- | --- | --- |');
    for (const op of items) {
      used.add(`${op.method} ${op.path}`);
      lines.push(`| \`${op.method}\` | \`${op.path}\` | ${escCell(op.summary)} |`);
    }
    lines.push('');
  };

  for (const group of REST_GROUPS) {
    const items = ops
      .filter((op) => group.prefixes.some((p) => op.path === p || op.path.startsWith(`${p}/`)))
      .sort((a, b) => a.path.localeCompare(b.path) || METHOD_ORDER.indexOf(a.method.toLowerCase()) - METHOD_ORDER.indexOf(b.method.toLowerCase()));
    if (items.length === 0) continue;
    lines.push(`## ${group.title}`, '');
    renderTable(items);
  }

  const remaining = ops.filter((op) => !used.has(`${op.method} ${op.path}`));
  if (remaining.length > 0) {
    lines.push('## Other endpoints', '');
    renderTable(remaining);
  }

  return lines.join('\n');
}

mkdirSync(refOut, { recursive: true });
const contractDir = findContractDir();

if (contractDir) {
  const mcpPath = join(contractDir, 'mcp-tools.json');
  const oaPath = join(contractDir, 'openapi.json');
  if (existsSync(mcpPath)) {
    const tools = JSON.parse(readFileSync(mcpPath, 'utf8'));
    writeFileSync(join(refOut, 'mcp-tools.md'), renderMcpTools(tools));
    log(`generated reference/mcp-tools.md (${tools.length} tools)`);
  }
  if (existsSync(oaPath)) {
    const oa = JSON.parse(readFileSync(oaPath, 'utf8'));
    writeFileSync(join(refOut, 'rest-api.md'), renderRestApi(oa));
    log(`generated reference/rest-api.md (${Object.keys(oa.paths ?? {}).length} paths)`);
  }
} else {
  const fallback = (title, file) => `---
title: "${title}"
---

Could not fetch \`contract/${file}\` from \`forge-orbit/orrery\` during this offline build. View the live contract on [GitHub](${repoWebBase}/blob/${ref}/contract/${file}).
`;
  if (!existsSync(join(refOut, 'mcp-tools.md'))) {
    writeFileSync(join(refOut, 'mcp-tools.md'), fallback('MCP tools reference', 'mcp-tools.json'));
  }
  if (!existsSync(join(refOut, 'rest-api.md'))) {
    writeFileSync(join(refOut, 'rest-api.md'), fallback('REST API reference', 'openapi.json'));
  }
  log('contract sync skipped (offline fallback written)');
}
