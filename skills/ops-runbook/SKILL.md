---
name: ops-runbook
description: "Execute operational runbooks — guided step-by-step procedures with progress tracking"
argument-hint: "[list|run <name>]"
user-invocable: true
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(ls *), Bash(git *), Bash(npm *), Bash(node *), Bash(mkdir *), mcp__ops__*
---

# Ops Runbook — Runbook Executor

You are a runbook executor. Your job is to guide users through step-by-step operational procedures for Claude Code plugin maintenance, tracking progress along the way.

## Sub-commands

Parse `$ARGUMENTS` to determine the sub-command:

- **`list`** (default): Show available runbooks
- **`run <name>`**: Execute a specific runbook

## List Sub-command

Show the available built-in runbooks:

```
## Available Runbooks

| Name | Steps | Description |
|------|-------|-------------|
| `full-health` | 6 | Complete health audit with issue creation and fix attempts |
| `release-prep` | 8 | Full release preparation checklist |
| `dependency-update` | 5 | Update and audit all dependencies |
| `new-plugin-setup` | 7 | Set up maintenance tracking for a new plugin |
```

Also call `ops_runbook_list` to show recent executions if any exist.

## Run Sub-command

Parse the runbook name from `$ARGUMENTS` and execute the corresponding procedure.

### Before Starting

1. Call `ops_project_list` to identify the target project
2. Call `ops_runbook_start` with the project_id, runbook_name, and total_steps
3. Save the execution ID for progress tracking

### After Each Step

Call `ops_runbook_step` with:
- The execution ID
- Step name, status (pass/fail/skip), message, and duration

### On Completion

Call `ops_runbook_complete` with the final status.

---

## Built-in Runbooks

### `full-health` (6 steps)

1. **Verify project registration** — Check if the project is registered, register if not
2. **Run health scan** — Execute the full health check suite (same as `/ops-health scan`)
3. **Create issues** — Auto-create issues for all failed checks
4. **Attempt auto-fixes** — Try to fix common issues (missing files, config issues)
5. **Re-scan** — Run health check again to verify fixes
6. **Generate report** — Present before/after comparison with remaining action items

### `release-prep` (8 steps)

1. **Health gate** — Run health scan, abort if score < 60
2. **Issue review** — Check for critical/high open issues
3. **Dependency audit** — Run `!npm audit` and `!npm outdated`
4. **Test verification** — Run `!npm test` if test script exists, or `!npm run typecheck`
5. **Build verification** — Run `!npm run build` and verify output
6. **Version bump** — Ask for bump type and update version files
7. **Changelog generation** — Generate changelog from git history
8. **Tag creation** — Create annotated git tag

### `dependency-update` (5 steps)

1. **Audit current state** — Run `!npm audit --json` and `!npm outdated --json`
2. **Identify updates** — Parse outdated packages, categorize by severity
3. **Apply updates** — Run `!npm update` for minor/patch updates
4. **Verify build** — Run `!npm run build` and `!npm run typecheck` after updates
5. **Record results** — Create issues for any remaining outdated/vulnerable packages

### `new-plugin-setup` (7 steps)

1. **Detect project** — Call `ops_project_detect` to scan the project
2. **Register project** — Call `ops_project_create` with detected info
3. **Initial health scan** — Run the full health check suite
4. **Create baseline issues** — Auto-create issues for all findings
5. **Check git setup** — Verify git repo, remote, branch conventions
6. **Verify build pipeline** — Ensure build/typecheck scripts work
7. **Generate initial report** — Present project overview with health baseline

---

## Execution Format

During execution, present progress clearly:

```
## Runbook: <name>

### Step 1/N: <step name>
<executing...>
Result: <pass/fail/skip> — <message>

### Step 2/N: <step name>
<executing...>
Result: <pass/fail/skip> — <message>

...

## Summary
- Steps completed: X/N
- Status: <completed/failed>
- Duration: <total time>
```

## Next Steps

After runbook execution, suggest relevant follow-up actions based on the results.
