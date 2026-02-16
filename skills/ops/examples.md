# Ops — Worked Examples

## 1. First-Time Project Registration + Health Scan

A new plugin has just been built. Register it and get a baseline health score.

```
User: /ops init

→ ops_project_detect scans the current directory
  Detected: skills (2), MCP server, hooks — type: full

→ ops_project_create registers the project
  Created: proj_abc123 "my-plugin" v0.1.0

→ ops_template_get category=full-plugin loads the check template

→ ops_health_create records the initial scan
  Score: 72/100 (warning)
  Failing: no ARCHITECTURE.md, outdated deps, missing examples

→ ops_health_export writes reports/health-2025-05-15.md

Result: Project registered, baseline health report exported,
3 issues auto-created for the failing checks.
```

## 2. Health Scan → Issue Triage → Fix Workflow

Regular maintenance cycle on an existing project.

```
User: /ops-health scan

→ ops_health_create records the scan
  Score: 65/100 (warning)
  3 failures: typecheck errors, outdated @types/node, missing license

→ Issues auto-created:
  - [critical] TypeScript errors in src/utils.ts
  - [medium] @types/node outdated by 2 major versions
  - [low] Missing LICENSE file

User: /ops-issues list

→ ops_issue_list returns 3 open issues sorted by priority

User: Fix the typecheck errors

→ Developer fixes the type errors
→ ops_issue_close id=issue_1 resolution="Fixed type errors in utils.ts"

User: /ops-health scan

→ New scan: Score: 82/100 (pass)
  Improvement: +17 points
```

## 3. Release Preparation (Bump + Changelog + Tag)

Cutting a new minor release after adding features.

```
User: /ops-release bump minor

→ ops_health_latest checks readiness
  Score: 92/100 — good to release

→ Current version: 0.1.0 → 0.2.0
→ package.json updated

→ ops_release_create records the release
  Version: 0.2.0, type: minor

→ Changelog generated from git log + closed issues:
  - Added template system (3 templates)
  - Added export system (health reports + changelogs)
  - Fixed 5 issues from health scans

→ ops_release_update adds git_tag=v0.2.0, commit_sha=abc1234

→ ops_release_export writes CHANGELOG.md

Result: v0.2.0 released, tagged, changelog exported.
```

## 4. Emergency Hotfix Runbook

A critical bug is found in production. Walk through the hotfix process.

```
User: /ops-runbook run hotfix

→ ops_runbook_start creates execution: 5 steps

Step 1: Identify the bug
→ ops_issue_create priority=critical, category=bug
→ ops_runbook_step: "Bug identified in release/crud.ts"

Step 2: Create fix branch
→ git checkout -b hotfix/fix-release-crash
→ ops_runbook_step: "Branch created"

Step 3: Apply fix and test
→ Fix applied, npm run typecheck passes
→ ops_runbook_step: "Fix applied, tests pass"

Step 4: Bump patch version
→ ops_release_create version=0.1.1, type=patch
→ ops_runbook_step: "Version bumped to 0.1.1"

Step 5: Tag and record
→ ops_release_update with git tag and SHA
→ ops_runbook_complete status=completed

Result: Hotfix 0.1.1 released in 4 steps, runbook recorded.
```

## 5. Multi-Plugin Dashboard Check

Check health across all registered plugins at once.

```
User: /ops status

→ ops_project_list returns 3 projects:
  - plugin-architect v1.2.0 (full)
  - plugin-gtm v0.3.0 (mcp)
  - plugin-ops v0.2.0 (full)

→ ops_health_latest for each project:
  - plugin-architect: 95/100 (pass)
  - plugin-gtm: 88/100 (pass)
  - plugin-ops: 72/100 (warning)

→ ops_issue_stats:
  - 0 critical, 2 high, 5 medium across all projects
  - plugin-ops has the most open issues (4)

Dashboard:
┌─────────────────┬─────────┬───────┬────────┐
│ Project         │ Version │ Score │ Issues │
├─────────────────┼─────────┼───────┼────────┤
│ plugin-architect│ 1.2.0   │ 95    │ 1      │
│ plugin-gtm      │ 0.3.0   │ 88    │ 2      │
│ plugin-ops      │ 0.2.0   │ 72    │ 4      │
└─────────────────┴─────────┴───────┴────────┘

Recommendation: Run /ops-health scan on plugin-ops to address warnings.
```
