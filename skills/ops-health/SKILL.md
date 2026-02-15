---
name: ops-health
description: "Run health scans on Claude Code plugins — check structure, skills, MCP, deps, quality"
argument-hint: "[scan|report|compare|fix]"
user-invocable: true
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(ls *), Bash(git *), Bash(npm *), Bash(node *), Bash(wc *), WebSearch, WebFetch, mcp__ops__*
---

# Ops Health — Plugin Health Scanner

You are a plugin health scanner. Your job is to thoroughly analyze a Claude Code plugin project and produce an actionable health report.

## Sub-commands

Parse `$ARGUMENTS` to determine the sub-command:

- **`scan`** (default): Run a full health scan on the project
- **`report`**: Show the latest health report for the project
- **`compare`**: Compare the two most recent health scans
- **`fix`**: Attempt to auto-fix common issues found in the latest scan

## Scan Workflow

### Step 1: Identify the Project

1. Call `ops_project_list` to find registered projects
2. If multiple projects exist, ask the user which one to scan
3. If no projects exist, suggest running `/ops init` first
4. Get the project path from the project record

### Step 2: Run Health Checks (~25 checks)

Scan the project directory and run checks across these categories:

**Structure Checks:**
- `package.json` exists and has required fields (name, version, description, type, main, scripts)
- `tsconfig.json` exists with strict mode
- `.gitignore` exists and covers node_modules/, dist/
- `README.md` exists and is not empty
- `ARCHITECTURE.md` exists
- `.claude-plugin/plugin.json` exists with required fields
- Source directory structure matches conventions

**Skills Checks (if has_skills):**
- `skills/` directory exists with at least one skill
- Each SKILL.md has valid frontmatter (name, description, allowed-tools, user-invocable)
- Router skill exists (matches plugin name)
- Skills have argument-hint defined

**MCP Checks (if has_mcp):**
- `.mcp.json` exists and is valid JSON
- Server entry point exists (`src/index.ts` or referenced in .mcp.json)
- MCP SDK is in dependencies
- `tsup.config.ts` or build config exists

**Dependency Checks:**
- `package-lock.json` or lockfile exists
- No outdated critical dependencies (check `!npm outdated --json`)
- No known vulnerabilities (check `!npm audit --json`)
- Node engine requirement specified

**Hooks Checks (if has_hooks):**
- `.claude/settings.json` exists
- Hook commands are valid

**Quality Checks:**
- TypeScript strict mode enabled
- Build script exists and is configured
- Typecheck script exists
- No TODO/FIXME/HACK in source files (count them)
- Git working tree is clean
- Has meaningful git history (> 1 commit)

### Step 3: Score and Summarize

For each check, record:
```json
{
  "name": "check-name",
  "status": "pass" | "warning" | "fail",
  "message": "Human-readable result",
  "details": "Optional additional context"
}
```

Calculate overall score:
- Each pass = full points (varies by check importance)
- Each warning = half points
- Each fail = 0 points
- Score = (earned / possible) * 100

Determine overall status:
- `pass`: score >= 80
- `warning`: score >= 50
- `fail`: score < 50

### Step 4: Persist and Report

1. Call `ops_health_create` with the results
2. For each `fail` check, call `ops_issue_create` with source `health-scan`
3. Present the health report:

```
## Health Report: <project name>

**Score:** <score>/100 [<status>]
**Date:** <timestamp>

### Results

| Check | Status | Message |
|-------|--------|---------|
| ... | ... | ... |

### Issues Created
- <issue title> [<priority>]

### Recommendations
1. <action item>
2. <action item>
```

## Report Sub-command

1. Call `ops_health_latest` for the project
2. Parse the checks JSON and display the report format above

## Compare Sub-command

1. Call `ops_health_list` for the project
2. Take the two most recent checks
3. Show a diff: which checks improved, which regressed, score delta

## Fix Sub-command

1. Call `ops_health_latest` for the project
2. For each `fail` check, attempt auto-fixes where safe:
   - Missing `.gitignore`: create with standard contents
   - Missing README: create template
   - Missing ARCHITECTURE.md: create template
   - Missing frontmatter fields: add them
3. Report what was fixed and what needs manual attention

## Next Steps

After a health scan, suggest:
- `/ops-issues triage` to review and prioritize issues
- `/ops-release prepare` if the project is healthy and ready for release
