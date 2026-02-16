# Architecture

## Overview

plugin-ops is the maintenance and operations engine for Claude Code plugins. It provides health scanning, dependency management, versioning/releases, issue tracking, and operational runbooks — all focused specifically on Claude Code plugin projects.

## Ecosystem

```
plugin-architect  →  plugin-gtm  →  plugin-ops
  (Design & Build)   (Launch & Market)  (Maintain & Operate)
```

plugin-ops is the third phase of the compound startup toolkit. After a plugin is built (plugin-architect) and launched (plugin-gtm), plugin-ops handles ongoing maintenance.

## Components

### Skills (5)

| Skill | Purpose |
|-------|---------|
| `/ops` | Command router + status dashboard |
| `/ops-health` | Health scanning with ~25 checks |
| `/ops-issues` | Issue triage and management |
| `/ops-release` | Version bumping, changelogs, tagging |
| `/ops-runbook` | Guided operational procedures |

### MCP Server

- **32 tools** across 7 domains (project, health, issue, release, runbook, export, template)
- **3 resources** (projects, health, issues)
- Runs over stdio transport
- SQLite persistence with WAL mode

### Data Model

```
Project (1) ──┬──> (N) Health Checks ──> (SET NULL) Issues
              ├──> (N) Issues          (CASCADE)
              ├──> (N) Releases        (CASCADE)
              └──> (N) Runbook Executions (CASCADE)
```

**5 tables:** projects, health_checks, issues, releases, runbook_executions

## File Structure

```
plugin-ops/
├── .claude-plugin/          # Plugin manifests
├── skills/                  # 5 skill definitions
├── src/
│   ├── index.ts             # MCP server entry (32 tools + 3 resources)
│   ├── db.ts                # SQLite layer (WAL, TTL connection pool)
│   ├── types.ts             # TypeScript interfaces
│   ├── lib/
│   │   ├── paths.ts         # Path resolution
│   │   └── logger.ts        # JSON file logger with rotation
│   ├── project/crud.ts      # Project CRUD + detect
│   ├── health/
│   │   ├── crud.ts          # Health check CRUD
│   │   └── export.ts        # Health report export + diff
│   ├── issue/crud.ts        # Issue CRUD + stats
│   ├── release/
│   │   ├── crud.ts          # Release CRUD
│   │   └── export.ts        # Changelog export
│   ├── runbook/crud.ts      # Runbook execution CRUD
│   └── templates/
│       ├── index.ts         # Template registry (list/get)
│       ├── skill-only.ts    # Skill-only plugin template
│       ├── mcp-plugin.ts    # MCP plugin template
│       └── full-plugin.ts   # Full plugin template
├── blueprints/              # YAML workflow definitions for plugin-hive
│   ├── ops-full-maintenance.yml
│   ├── ops-release-cycle.yml
│   ├── ops-dependency-audit.yml
│   └── ops-new-plugin-setup.yml
```

## Conventions

- **ESM-only** — `"type": "module"` in package.json, `.js` extensions in imports
- **Node 22+** — Uses native `node:sqlite` (DatabaseSync)
- **Zod validation** — All MCP tool parameters validated with Zod schemas
- **UUID primary keys** — `randomUUID()` from `node:crypto`
- **JSON in SQLite** — Complex data stored as TEXT, parsed at application layer
- **TTL connection pool** — Database connection recycled every 5 seconds
- **Structured logging** — JSON lines to file with 5MB rotation
- **Immutable records** — Health checks and releases are append-only (no updated_at)
- **Cascade deletes** — Deleting a project removes all related data
- **Versioned migrations** — `migrateV0_2_0()` uses PRAGMA table_info to safely add columns

## Export System

Health reports and release changelogs can be exported to markdown files on disk:

- `ops_health_export` — Writes a health report to `reports/health-<date>.md`
- `ops_health_diff` — Compares DB state vs exported file (in_sync, file_modified, file_missing, not_exported)
- `ops_release_export` — Writes all releases to `CHANGELOG.md`

After export, `published_at` and `file_path` are updated on the source records.

## Template System

Pre-configured health check suites for different plugin architectures:

| Template | Checks | Focus |
|----------|--------|-------|
| `skill-only` | 8 | SKILL.md, frontmatter, manifest, docs |
| `mcp-plugin` | 10 | Build pipeline, deps, types, server entry |
| `full-plugin` | 15 | All of the above + hooks, agents, architecture |

Templates are accessed via `ops_template_list` and `ops_template_get`.

## Blueprints

YAML workflow definitions for plugin-hive swarm orchestration:

| Blueprint | Flights | Purpose |
|-----------|---------|---------|
| `ops-full-maintenance` | 4 | Health scan → triage → fix → verify |
| `ops-release-cycle` | 5 | Health gate → bump → changelog → tag → export |
| `ops-dependency-audit` | 4 | Audit → identify → update → verify |
| `ops-new-plugin-setup` | 5 | Detect → register → scan → issues → report |

Blueprints are static YAML consumed by plugin-hive — no runtime code in plugin-ops.
