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

- **27 tools** across 5 domains (project, health, issue, release, runbook)
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
│   ├── index.ts             # MCP server entry (27 tools + 3 resources)
│   ├── db.ts                # SQLite layer (WAL, TTL connection pool)
│   ├── types.ts             # TypeScript interfaces
│   ├── lib/
│   │   ├── paths.ts         # Path resolution
│   │   └── logger.ts        # JSON file logger with rotation
│   ├── project/crud.ts      # Project CRUD + detect
│   ├── health/crud.ts       # Health check CRUD
│   ├── issue/crud.ts        # Issue CRUD + stats
│   ├── release/crud.ts      # Release CRUD
│   └── runbook/crud.ts      # Runbook execution CRUD
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
