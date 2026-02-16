# plugin-ops

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-22%2B-green.svg)](https://nodejs.org)
[![Claude Code Plugin](https://img.shields.io/badge/Claude_Code-Plugin-blueviolet.svg)](https://docs.anthropic.com/en/docs/claude-code)

Maintenance and operations engine for Claude Code plugins — health scanning, dependency management, versioning, issue tracking, and runbooks.

## Why

After you **build** a plugin (plugin-architect) and **launch** it (plugin-gtm), you need to **maintain** it. plugin-ops gives you structured maintenance workflows that track health over time, manage issues, handle releases, and execute operational runbooks — all from within Claude Code.

## What You Get

| Skill | What It Does |
|-------|-------------|
| `/ops` | Command router + status dashboard |
| `/ops-health` | Scan plugins for ~25 health checks across structure, skills, MCP, deps, quality |
| `/ops-issues` | Track bugs, tech debt, and quality problems |
| `/ops-release` | Version bump + changelog + git tagging |
| `/ops-runbook` | Step-by-step guided operational procedures |

**32 MCP tools** for persistent data across sessions. **3 MCP resources** for quick access to projects, health, and issues.

## Install

**Step 1** — Add the marketplace (once per machine):

```
/plugin marketplace add twofoldtech-dakota/plugin-ops
```

**Step 2** — Install the plugin:

```
/plugin install plugin-ops@twofoldtech-dakota-plugin-ops
```

## Quick Start

```bash
# Register your plugin project
/ops init

# Run a health scan
/ops-health scan

# View the dashboard
/ops status

# Triage issues from the scan
/ops-issues triage

# Prepare a release
/ops-release prepare

# Run a full maintenance runbook
/ops-runbook run full-health
```

## Ecosystem

plugin-ops is part of a compound startup toolkit:

| Plugin | Phase | What It Does |
|--------|-------|-------------|
| plugin-architect | Design & Build | Design plugin architecture, generate scaffolding |
| plugin-gtm | Launch & Market | Product analysis, GTM plans, launch content |
| **plugin-ops** | **Maintain & Operate** | **Health scans, issues, releases, runbooks** |

## MCP Tools

### Project (6)
`ops_project_create` · `ops_project_get` · `ops_project_list` · `ops_project_update` · `ops_project_delete` · `ops_project_detect`

### Health (4)
`ops_health_create` · `ops_health_get` · `ops_health_list` · `ops_health_latest`

### Issues (7)
`ops_issue_create` · `ops_issue_get` · `ops_issue_list` · `ops_issue_update` · `ops_issue_close` · `ops_issue_delete` · `ops_issue_stats`

### Releases (5)
`ops_release_create` · `ops_release_get` · `ops_release_list` · `ops_release_latest` · `ops_release_update`

### Export (3)
`ops_health_export` · `ops_health_diff` · `ops_release_export`

### Templates (2)
`ops_template_list` · `ops_template_get`

### Runbooks (5)
`ops_runbook_start` · `ops_runbook_get` · `ops_runbook_list` · `ops_runbook_step` · `ops_runbook_complete`

## Development

```bash
npm install
npm run build        # Build with tsup
npm run dev          # Watch mode
npm run typecheck    # Type check
```

Requires Node.js 22+ (uses native `node:sqlite`).
