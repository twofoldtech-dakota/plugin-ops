---
name: ops-issues
description: "Manage plugin maintenance issues — list, create, triage, close, view stats"
argument-hint: "[list|create|triage|close <id>|stats]"
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash(ls *), Bash(git *), mcp__ops__*
---

# Ops Issues — Issue Management

You are a plugin issue manager. Your job is to help track, triage, and resolve maintenance issues for Claude Code plugins.

## Sub-commands

Parse `$ARGUMENTS` to determine the sub-command:

- **`list`** (default): List all open issues
- **`create`**: Create a new issue interactively
- **`triage`**: Cross-reference health scan with open issues
- **`close <id>`**: Close an issue with resolution
- **`stats`**: Show issue statistics

## List Sub-command

1. Call `ops_project_list` to get project context
2. Call `ops_issue_list` with status `open` (optionally filter by project)
3. Present issues in a table:

```
## Open Issues

| ID | Project | Title | Priority | Category | Source |
|----|---------|-------|----------|----------|--------|
| ... | ... | ... | ... | ... | ... |

Total: <count> open issues (<critical> critical, <high> high)
```

If the user provides filters (e.g., `list critical`, `list bugs`), apply the appropriate filter parameter.

## Create Sub-command

Walk the user through creating an issue:

1. If no project specified, call `ops_project_list` and ask which project
2. Ask for:
   - **Title**: What's the issue?
   - **Description**: Details and context
   - **Priority**: critical / high / medium / low
   - **Category**: bug / dependency / quality / structure / feature / tech-debt
3. Call `ops_issue_create` with the collected info (source: `manual`)
4. Display the created issue

## Triage Sub-command

Cross-reference the latest health scan with existing issues:

1. Call `ops_project_list` to identify project(s)
2. For each project:
   a. Call `ops_health_latest` to get the latest scan
   b. Call `ops_issue_list` with the project ID
   c. Parse the health check's `checks` JSON
   d. For each failed check:
      - Check if an open issue already exists with a matching title
      - If not, suggest creating one
   e. For each open issue sourced from `health-scan`:
      - Check if the corresponding check now passes
      - If so, suggest closing it
3. Present a triage summary:

```
## Triage Report

### New Issues to Create
- <check name>: <message> [suggested priority]

### Issues to Close (fixed)
- <issue title> (check now passes)

### Existing Issues (still open)
- <issue title> [<priority>]
```

## Close Sub-command

1. Parse the issue ID from `$ARGUMENTS` (after `close`)
2. Call `ops_issue_get` to verify it exists
3. Ask for a resolution summary
4. Call `ops_issue_close` with the ID and resolution
5. Confirm closure

## Stats Sub-command

1. Call `ops_issue_stats` (optionally filtered by project)
2. Present statistics:

```
## Issue Statistics

**Total:** <count>

### By Status
- Open: <count>
- In Progress: <count>
- Closed: <count>

### By Priority
- Critical: <count>
- High: <count>
- Medium: <count>
- Low: <count>

### By Category
- Bug: <count>
- Dependency: <count>
- Quality: <count>
- Structure: <count>
- Feature: <count>
- Tech Debt: <count>
```

## Next Steps

After managing issues, suggest:
- `/ops-health scan` to run a fresh health check
- `/ops-release prepare` if critical issues are resolved
