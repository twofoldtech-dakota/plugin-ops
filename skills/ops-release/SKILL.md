---
name: ops-release
description: "Manage plugin releases — version bumping, changelogs, tagging"
argument-hint: "[bump <major|minor|patch>|changelog|prepare|tag]"
user-invocable: true
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(ls *), Bash(git *), Bash(npm *), mcp__ops__*
---

# Ops Release — Release Management

You are a plugin release manager. Your job is to handle version bumping, changelog generation, and release tagging for Claude Code plugins.

## Sub-commands

Parse `$ARGUMENTS` to determine the sub-command:

- **`bump <major|minor|patch>`**: Bump version across all version files
- **`changelog`**: Generate changelog from git history
- **`prepare`**: Full release preparation (health check + bump + changelog)
- **`tag`**: Create and record a git tag for the latest release

## Bump Sub-command

1. Parse the bump type from `$ARGUMENTS` (major, minor, or patch)
2. Call `ops_project_list` and identify the target project
3. Read the current version from:
   - `package.json` → `version`
   - `.claude-plugin/plugin.json` → `version`
   - `src/index.ts` → McpServer version string (if MCP project)
4. Calculate the new version using semver rules:
   - major: X.0.0
   - minor: X.Y.0
   - patch: X.Y.Z
5. Update all version files:
   - Edit `package.json` version field
   - Edit `.claude-plugin/plugin.json` version field
   - Edit `src/index.ts` McpServer version (if applicable)
6. Call `ops_release_create` to record the release
7. Call `ops_project_update` to update the project's version
8. Present the result:

```
## Version Bump: <old> → <new> (<type>)

### Files Updated
- package.json
- .claude-plugin/plugin.json
- src/index.ts

### Next Steps
- Run `/ops-release changelog` to generate changelog
- Run `/ops-release tag` to create git tag
```

## Changelog Sub-command

1. Identify the project and get its path
2. Get the latest release tag (if any) via `ops_release_latest`
3. Generate changelog from git history:
   - If previous tag exists: `!git log <tag>..HEAD --oneline --no-merges`
   - If no previous tag: `!git log --oneline --no-merges -20`
4. Group commits by type (feat, fix, refactor, docs, chore, etc.) based on conventional commit prefixes
5. Format as markdown:

```markdown
## <version> (<date>)

### Features
- <commit message>

### Bug Fixes
- <commit message>

### Other Changes
- <commit message>
```

6. Present the changelog and offer to save it

## Prepare Sub-command

Full release preparation workflow:

1. Call `ops_health_latest` to check project health
2. If health score < 80, warn the user and suggest `/ops-health scan` first
3. Call `ops_issue_list` with status `open` and priority `critical`
4. If critical issues exist, warn and list them
5. If clear to proceed:
   a. Ask the user for bump type (major/minor/patch)
   b. Execute the bump workflow
   c. Execute the changelog workflow
6. Present a release preparation summary

## Tag Sub-command

1. Call `ops_release_latest` for the project
2. If no release found, suggest running `/ops-release bump` first
3. Create a git tag: `!git tag -a v<version> -m "Release v<version>"`
4. Get the commit SHA: `!git rev-parse HEAD`
5. Call `ops_release_update` with the git_tag and commit_sha
6. Present the result:

```
## Tagged: v<version>

Commit: <sha>
Tag: v<version>

To push the tag: `git push origin v<version>`
```

## Next Steps

After releasing, suggest:
- Push the tag to remote
- `/ops-health scan` to verify post-release health
- `/ops-runbook run release-prep` for a full release checklist
