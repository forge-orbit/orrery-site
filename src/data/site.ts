// All page copy that links to the main repo or describes shipped and post-MVP features lives here,
// so it stays in step with forge-orbit/orrery as releases ship.

export const repo = 'https://github.com/forge-orbit/orrery';
export const integrationsRepo = 'https://github.com/forge-orbit/orrery-integrations';
export const releases = `${repo}/releases`;
export const version = 'v0.1.1';
export const issue = (n: number) => `${repo}/issues/${n}`;
export const needDiscussion = `${repo}/labels/need%20discussion`;

export const nav = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Self-hosted', href: '#self-hosted' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'Docs', href: 'docs/' },
];

export const harnesses: ReadonlyArray<{
  name: string;
  how: string;
  status: 'ready' | 'planned';
}> = [
  {
    name: 'Claude Code',
    how: 'Plugin marketplace (orrery@forge-orbit) — /mcp, lifecycle hooks & live inbox wait',
    status: 'ready',
  },
  {
    name: 'Codex CLI',
    how: 'Repo/local plugin marketplace (orrery@forge-orbit) — /mcp, lifecycle hooks & live inbox wait',
    status: 'ready',
  },
  {
    name: 'Cursor, Devin & cloud agents',
    how: 'Static /mcp endpoint + orrery_run_checkin (no local plugin needed)',
    status: 'ready',
  },
  {
    name: 'OpenCode',
    how: 'npm (@orrery/opencode-plugin)',
    status: 'planned',
  },
  {
    name: 'Hermes',
    how: 'PyPI / hermes plugins install',
    status: 'planned',
  },
];

export const integrationGuarantees = [
  {
    title: 'Allowlisted metadata only',
    body: 'Hooks send only lifecycle events, session/subagent IDs, timestamps, and model/version strings. Prompts, transcripts, and tool I/O never leave the laptop.',
  },
  {
    title: 'Non-blocking by design',
    body: 'Hooks always exit 0 and swallow network or timeout errors, so an unreachable Orrery instance never interrupts a coding session.',
  },
  {
    title: 'Live inbox waiting',
    body: 'After ask_for_input, the plugin’s orrery_wait_for_input waits for a human reply while renewing the matching Claim lease automatically.',
  },
];

export const loop = [
  {
    tool: 'claim_issue',
    title: 'Claim an issue',
    body: 'The agent pulls ready work and takes a five-minute atomic Claim lease. Two agents can never hold the same issue, and a crashed laptop releases it automatically.',
  },
  {
    tool: 'report_progress',
    title: 'Stream progress & telemetry',
    body: 'While working, the agent renews its lease, reports token and cost totals, and logs structured activity to a sidecar inspector. A person can raise a stop signal anytime.',
  },
  {
    tool: 'ask_for_input',
    title: 'Ask when blocked',
    body: 'When it hits a call it shouldn’t make alone, the question lands in the Needs-input inbox with a proposed fallback. After one hour, project policy pauses the issue or applies the fallback.',
  },
  {
    tool: 'stop_session',
    title: 'Hand it back for review',
    body: 'The agent closes its session with a Handoff summary. A person inspects it in Review and approves it to Done or sends it back.',
  },
];

export const features = [
  {
    title: 'Agents as workers',
    body: 'Register agents with workspace-scoped API keys, rotation and expiry. They claim issues through atomic work sessions, report token/cost telemetry, and show up on the board beside your team.',
  },
  {
    title: 'Live runs & sidecar inspector',
    body: 'Watch active sessions at once: the issue held, harness and model attribution (Claude Code, Codex, Cursor and more), child worker trees, structured activity blocks, and a one-click stop signal.',
  },
  {
    title: 'Needs-input inbox & My work',
    body: 'Every blocked agent question lands in one inbox with one-hour fallback policies. My work aggregates active sessions, review handoffs and assigned issues across every workspace.',
  },
  {
    title: 'Human review & notifications',
    body: 'Agents hand work back to Review; people decide when it’s Done. A proactive sweeper resolves expired leases and deadlines, firing in-app notifications automatically.',
  },
  {
    title: 'Project knowledge & dependencies',
    body: 'Structured Markdown knowledge per project, one-level subtasks with close guards, acyclic blocked_by dependencies, GitHub-flavored Markdown with Mermaid diagrams, and 30-day Trash restore.',
  },
  {
    title: 'Webhooks, access & audit trail',
    body: 'Personal and Shared workspaces with per-project grants, HMAC-signed outgoing webhooks with a transactional outbox and default-deny SSRF guard, and an actor-attributed audit log.',
  },
];

export const toolGroups = [
  {
    group: 'Projects',
    tools: ['list_projects', 'get_project', 'list_knowledge', 'get_knowledge', 'create_knowledge', 'update_knowledge'],
  },
  {
    group: 'Issues',
    tools: ['list_issues', 'get_issue', 'create_issue', 'update_issue', 'list_labels', 'add_blocked_by', 'create_comment', 'add_issue_link'],
  },
  {
    group: 'Sessions',
    tools: ['ready_work', 'claim_issue', 'renew_claim', 'report_progress', 'log_session_activity', 'reacquire_issue', 'stop_session'],
  },
  {
    group: 'Inbox & runs',
    tools: ['ask_for_input', 'list_issue_questions', 'orrery_run_checkin', 'list_activity'],
  },
];

export type MilestoneStatus = 'done' | 'dropped';

export const milestones: ReadonlyArray<{
  n: number;
  id: string;
  title: string;
  detail: string;
  status: MilestoneStatus;
}> = [
  {
    n: 1,
    id: 'M0',
    title: 'Foundation',
    detail: 'Docker Compose, CI, first-run bootstrap, encrypted SMTP settings',
    status: 'done',
  },
  {
    n: 2,
    id: 'M1',
    title: 'Auth, workspaces and agent identities',
    detail: 'Personal & Shared workspaces, delegated permissions, workspace-scoped API keys',
    status: 'done',
  },
  {
    n: 3,
    id: 'M2',
    title: 'Projects and issues',
    detail: 'Six-state workflow, subtasks, labels, acyclic dependencies, project knowledge, 30-day Trash',
    status: 'done',
  },
  {
    n: 4,
    id: 'M3',
    title: 'Agent API and sessions',
    detail: '39 MCP tools with REST parity, five-minute Claim leases, stop signals, telemetry, Needs-input inbox',
    status: 'done',
  },
  {
    n: 5,
    id: 'M4',
    title: 'Board, agents panel, inbox and My work',
    detail: 'Six-column Kanban board, sidecar activity inspector, cross-workspace My work view',
    status: 'done',
  },
  {
    n: 6,
    id: 'M5',
    title: 'Shared vault',
    detail: 'Dropped (not planned) — replaced by project knowledge and post-MVP agent-memory upgrades (#140)',
    status: 'dropped',
  },
  {
    n: 7,
    id: 'M6',
    title: 'Release polish',
    detail: 'Proactive sweeper, in-app notifications, signed outgoing webhooks, operator guides, GHCR releases',
    status: 'done',
  },
];

export const later = [
  { label: 'Agent-memory upgrades (FTS, doc↔issue links)', href: issue(140) },
  { label: 'Agent-customizable UI (rich blocks, slots, views)', href: issue(15) },
  { label: 'Plugin system', href: issue(14) },
];
