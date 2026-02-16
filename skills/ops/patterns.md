# Ops — Reference Patterns

## Health Check Patterns by Plugin Type

### Skill-Only Plugins
Focus on: SKILL.md validity, frontmatter, plugin manifest, documentation.
Skip: build pipeline, dependency checks, MCP server validation.

```
Template: skill-only
Key checks: skill-file-exists, skill-frontmatter-valid, plugin-manifest-exists
Typical score range: 80-100 (few moving parts)
```

### MCP Plugins
Focus on: build pipeline, TypeScript config, dependencies, server entry point.
Include: package.json, tsconfig, MCP SDK version, build/typecheck scripts.

```
Template: mcp-plugin
Key checks: build-succeeds, typecheck-passes, mcp-sdk-installed, entry-point-exists
Typical score range: 60-90 (more failure modes)
```

### Full Plugins (Skills + MCP + Hooks + Agents)
Focus on: everything above plus hooks validity, agent configs, cross-component integration.

```
Template: full-plugin
Key checks: all of the above + hooks-valid, agents-valid, architecture-doc-exists
Typical score range: 50-85 (highest complexity)
```

## Release Workflows

### Patch Release (Bug Fix)
1. Health gate (score >= 70, no critical issues)
2. Bump patch version (0.1.0 → 0.1.1)
3. Generate changelog from closed bug issues
4. Tag, commit, export CHANGELOG.md

### Minor Release (New Features)
1. Health gate (score >= 80, no critical/high issues)
2. Bump minor version (0.1.0 → 0.2.0)
3. Generate changelog from features + fixes
4. Update ARCHITECTURE.md if structure changed
5. Tag, commit, export CHANGELOG.md

### Major Release (Breaking Changes)
1. Health gate (score >= 90, zero open issues)
2. Bump major version (0.2.0 → 1.0.0)
3. Full changelog with migration guide
4. Update README, ARCHITECTURE.md, examples
5. Tag, commit, export CHANGELOG.md
6. Consider: blueprint for downstream migration

## Issue Categorization Guide

| Category | When to Use | Typical Priority |
|----------|-------------|-----------------|
| `bug` | Something is broken or produces wrong output | critical/high |
| `dependency` | Outdated, vulnerable, or missing dependency | medium/high |
| `quality` | Missing docs, poor naming, no tests | medium/low |
| `structure` | Missing files, wrong directory layout | high/medium |
| `feature` | Enhancement or new capability needed | medium/low |
| `tech-debt` | Working but fragile, needs refactoring | low/medium |

### Priority Assignment
- **critical** — Blocks builds, breaks functionality, security vulnerability
- **high** — Significant quality impact, affects multiple areas
- **medium** — Should fix before next release, isolated impact
- **low** — Nice to have, cosmetic, can defer

## Runbook Composition Patterns

### Sequential Runbook
Steps execute in order, each depending on the previous.
Use for: hotfix, release, migration.

```
Step 1 → Step 2 → Step 3 → Step 4
Each step logs status via ops_runbook_step
Final state set via ops_runbook_complete
```

### Gate-and-Continue Runbook
A gate step checks preconditions before allowing remaining steps.
Use for: release cycles, deployments.

```
Gate Step (health check)
  ├─ PASS → Continue to Step 2, 3, 4
  └─ FAIL → Stop, report blockers
```

### Fan-Out Runbook
Multiple independent steps execute after a shared precondition.
Use for: multi-project audits, batch operations.

```
Step 1 (setup)
  ├─ Step 2a (project A)
  ├─ Step 2b (project B)
  └─ Step 2c (project C)
Step 3 (aggregate results)
```

## Cross-Plugin Integration Patterns

### Architect → Ops Handoff
After `plugin-architect` builds a plugin:
1. Run `/ops init` to register the project
2. Run `/ops-health scan` for baseline
3. Set up the maintenance blueprint

### GTM → Ops Handoff
After `plugin-gtm` launches a product:
1. Run `/ops init` if not already registered
2. Run `/ops-release bump` for the launch version
3. Export CHANGELOG.md for the launch page
4. Schedule regular health scans

### Ops → Hive Integration
Use blueprints for automated multi-step workflows:
- `ops-full-maintenance` — scheduled maintenance
- `ops-release-cycle` — release automation
- `ops-dependency-audit` — security maintenance
- `ops-new-plugin-setup` — onboarding new projects
