#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { log } from "./lib/logger.js";
import { getProjectDir } from "./lib/paths.js";

import {
  createProject,
  getProject,
  listProjects,
  updateProject,
  deleteProject,
  detectProject,
} from "./project/crud.js";
import {
  createHealthCheck,
  getHealthCheck,
  listHealthChecks,
  getLatestHealthCheck,
} from "./health/crud.js";
import {
  createIssue,
  getIssue,
  listIssues,
  updateIssue,
  closeIssue,
  deleteIssue,
  getIssueStats,
} from "./issue/crud.js";
import {
  createRelease,
  getRelease,
  listReleases,
  getLatestRelease,
  updateRelease,
} from "./release/crud.js";
import {
  startRunbook,
  getRunbookExecution,
  listRunbookExecutions,
  logRunbookStep,
  completeRunbook,
} from "./runbook/crud.js";

const server = new McpServer({
  name: "ops",
  version: "0.1.0",
});

// ── Project Tools (6) ───────────────────────────────────────────

server.tool(
  "ops_project_create",
  "Register a plugin project for maintenance tracking",
  {
    name: z.string().describe("Plugin name"),
    type: z.enum(["skill-only", "mcp", "full"]).optional().describe("Plugin architecture type"),
    path: z.string().optional().describe("Absolute path to project root"),
    version: z.string().optional().describe("Current semver version"),
    description: z.string().optional().describe("What the plugin does"),
    has_skills: z.number().optional().describe("1 if has skills, 0 otherwise"),
    has_mcp: z.number().optional().describe("1 if has MCP server, 0 otherwise"),
    has_hooks: z.number().optional().describe("1 if has hooks, 0 otherwise"),
    has_agents: z.number().optional().describe("1 if has agents, 0 otherwise"),
    metadata: z.record(z.unknown()).optional().describe("Extra metadata (repo URL, etc.)"),
  },
  async (params) => {
    try {
      const project = createProject(params);
      return { content: [{ type: "text", text: JSON.stringify(project, null, 2) }] };
    } catch (err) {
      log.error("ops_project_create failed", err);
      return { content: [{ type: "text", text: `Error: ${err}` }], isError: true };
    }
  },
);

server.tool(
  "ops_project_get",
  "Get a registered project by ID",
  { id: z.string().describe("Project ID") },
  async ({ id }) => {
    const project = getProject(id);
    if (!project) return { content: [{ type: "text", text: "Project not found" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(project, null, 2) }] };
  },
);

server.tool(
  "ops_project_list",
  "List all registered plugin projects",
  {},
  async () => {
    const projects = listProjects();
    return { content: [{ type: "text", text: JSON.stringify(projects, null, 2) }] };
  },
);

server.tool(
  "ops_project_update",
  "Update project details",
  {
    id: z.string().describe("Project ID"),
    name: z.string().optional(),
    type: z.enum(["skill-only", "mcp", "full"]).optional(),
    path: z.string().optional(),
    version: z.string().optional(),
    description: z.string().optional(),
    has_skills: z.number().optional(),
    has_mcp: z.number().optional(),
    has_hooks: z.number().optional(),
    has_agents: z.number().optional(),
    metadata: z.string().optional().describe("JSON string of metadata object"),
  },
  async ({ id, ...updates }) => {
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    const project = updateProject(id, filtered);
    if (!project) return { content: [{ type: "text", text: "Project not found" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(project, null, 2) }] };
  },
);

server.tool(
  "ops_project_delete",
  "Delete a project and all cascading data (health checks, issues, releases, runbooks)",
  { id: z.string().describe("Project ID") },
  async ({ id }) => {
    const ok = deleteProject(id);
    return { content: [{ type: "text", text: ok ? "Deleted" : "Project not found" }] };
  },
);

server.tool(
  "ops_project_detect",
  "Scan a project path to detect components (skills, MCP, hooks, agents)",
  { path: z.string().optional().describe("Path to scan (defaults to PROJECT_DIR)") },
  async ({ path }) => {
    try {
      const projectPath = path || getProjectDir();
      const result = detectProject(projectPath);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      log.error("ops_project_detect failed", err);
      return { content: [{ type: "text", text: `Error: ${err}` }], isError: true };
    }
  },
);

// ── Health Check Tools (4) ──────────────────────────────────────

server.tool(
  "ops_health_create",
  "Record a health check snapshot for a project",
  {
    project_id: z.string().describe("Project ID"),
    status: z.enum(["pass", "warning", "fail"]).describe("Overall health status"),
    score: z.number().describe("Health score 0-100"),
    checks: z
      .array(
        z.object({
          name: z.string(),
          status: z.string(),
          message: z.string(),
          details: z.string().optional(),
        }),
      )
      .describe("Array of individual check results"),
    summary: z.string().describe("Human-readable summary"),
  },
  async (params) => {
    try {
      const check = createHealthCheck(params);
      return { content: [{ type: "text", text: JSON.stringify(check, null, 2) }] };
    } catch (err) {
      log.error("ops_health_create failed", err);
      return { content: [{ type: "text", text: `Error: ${err}` }], isError: true };
    }
  },
);

server.tool(
  "ops_health_get",
  "Get a health check by ID",
  { id: z.string().describe("Health check ID") },
  async ({ id }) => {
    const check = getHealthCheck(id);
    if (!check) return { content: [{ type: "text", text: "Health check not found" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(check, null, 2) }] };
  },
);

server.tool(
  "ops_health_list",
  "List health check history for a project",
  { project_id: z.string().describe("Project ID") },
  async ({ project_id }) => {
    const checks = listHealthChecks(project_id);
    return { content: [{ type: "text", text: JSON.stringify(checks, null, 2) }] };
  },
);

server.tool(
  "ops_health_latest",
  "Get the most recent health check for a project",
  { project_id: z.string().describe("Project ID") },
  async ({ project_id }) => {
    const check = getLatestHealthCheck(project_id);
    if (!check) return { content: [{ type: "text", text: "No health checks found" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(check, null, 2) }] };
  },
);

// ── Issue Tools (7) ─────────────────────────────────────────────

server.tool(
  "ops_issue_create",
  "File a new issue for a project",
  {
    project_id: z.string().describe("Project ID"),
    title: z.string().describe("Issue title"),
    description: z.string().optional().describe("Issue description"),
    priority: z.enum(["critical", "high", "medium", "low"]).optional(),
    category: z.enum(["bug", "dependency", "quality", "structure", "feature", "tech-debt"]).optional(),
    source: z.enum(["manual", "health-scan"]).optional(),
    health_check_id: z.string().optional().describe("Health check that generated this issue"),
  },
  async (params) => {
    try {
      const issue = createIssue(params);
      return { content: [{ type: "text", text: JSON.stringify(issue, null, 2) }] };
    } catch (err) {
      log.error("ops_issue_create failed", err);
      return { content: [{ type: "text", text: `Error: ${err}` }], isError: true };
    }
  },
);

server.tool(
  "ops_issue_get",
  "Get an issue by ID",
  { id: z.string().describe("Issue ID") },
  async ({ id }) => {
    const issue = getIssue(id);
    if (!issue) return { content: [{ type: "text", text: "Issue not found" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(issue, null, 2) }] };
  },
);

server.tool(
  "ops_issue_list",
  "List issues with optional filters",
  {
    project_id: z.string().optional(),
    status: z.enum(["open", "in_progress", "closed"]).optional(),
    priority: z.enum(["critical", "high", "medium", "low"]).optional(),
    category: z.enum(["bug", "dependency", "quality", "structure", "feature", "tech-debt"]).optional(),
  },
  async (filters) => {
    const filtered = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined),
    ) as Parameters<typeof listIssues>[0];
    const issues = listIssues(filtered);
    return { content: [{ type: "text", text: JSON.stringify(issues, null, 2) }] };
  },
);

server.tool(
  "ops_issue_update",
  "Update issue fields",
  {
    id: z.string().describe("Issue ID"),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["open", "in_progress", "closed"]).optional(),
    priority: z.enum(["critical", "high", "medium", "low"]).optional(),
    category: z.enum(["bug", "dependency", "quality", "structure", "feature", "tech-debt"]).optional(),
    resolution: z.string().optional(),
  },
  async ({ id, ...updates }) => {
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    const issue = updateIssue(id, filtered);
    if (!issue) return { content: [{ type: "text", text: "Issue not found" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(issue, null, 2) }] };
  },
);

server.tool(
  "ops_issue_close",
  "Close an issue with a resolution",
  {
    id: z.string().describe("Issue ID"),
    resolution: z.string().describe("How the issue was resolved"),
  },
  async ({ id, resolution }) => {
    const issue = closeIssue(id, resolution);
    if (!issue) return { content: [{ type: "text", text: "Issue not found" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(issue, null, 2) }] };
  },
);

server.tool(
  "ops_issue_delete",
  "Delete an issue",
  { id: z.string().describe("Issue ID") },
  async ({ id }) => {
    const ok = deleteIssue(id);
    return { content: [{ type: "text", text: ok ? "Deleted" : "Issue not found" }] };
  },
);

server.tool(
  "ops_issue_stats",
  "Get issue counts by status, priority, and category",
  { project_id: z.string().optional().describe("Filter by project ID") },
  async ({ project_id }) => {
    const stats = getIssueStats(project_id);
    return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] };
  },
);

// ── Release Tools (5) ───────────────────────────────────────────

server.tool(
  "ops_release_create",
  "Record a new release for a project",
  {
    project_id: z.string().describe("Project ID"),
    version: z.string().describe("Semver version string"),
    type: z.enum(["major", "minor", "patch"]).describe("Release type"),
    changelog: z.string().optional().describe("Markdown changelog entry"),
    files_bumped: z.array(z.string()).optional().describe("File paths that were version-bumped"),
    git_tag: z.string().optional().describe("Git tag name"),
    commit_sha: z.string().optional().describe("Git commit SHA"),
  },
  async (params) => {
    try {
      const release = createRelease(params);
      return { content: [{ type: "text", text: JSON.stringify(release, null, 2) }] };
    } catch (err) {
      log.error("ops_release_create failed", err);
      return { content: [{ type: "text", text: `Error: ${err}` }], isError: true };
    }
  },
);

server.tool(
  "ops_release_get",
  "Get a release by ID",
  { id: z.string().describe("Release ID") },
  async ({ id }) => {
    const release = getRelease(id);
    if (!release) return { content: [{ type: "text", text: "Release not found" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(release, null, 2) }] };
  },
);

server.tool(
  "ops_release_list",
  "List releases for a project",
  { project_id: z.string().describe("Project ID") },
  async ({ project_id }) => {
    const releases = listReleases(project_id);
    return { content: [{ type: "text", text: JSON.stringify(releases, null, 2) }] };
  },
);

server.tool(
  "ops_release_latest",
  "Get the most recent release for a project",
  { project_id: z.string().describe("Project ID") },
  async ({ project_id }) => {
    const release = getLatestRelease(project_id);
    if (!release) return { content: [{ type: "text", text: "No releases found" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(release, null, 2) }] };
  },
);

server.tool(
  "ops_release_update",
  "Update release git_tag and commit_sha after tagging",
  {
    id: z.string().describe("Release ID"),
    git_tag: z.string().optional().describe("Git tag name"),
    commit_sha: z.string().optional().describe("Git commit SHA"),
  },
  async ({ id, ...updates }) => {
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    ) as { git_tag?: string; commit_sha?: string };
    const release = updateRelease(id, filtered);
    if (!release) return { content: [{ type: "text", text: "Release not found" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(release, null, 2) }] };
  },
);

// ── Runbook Tools (5) ───────────────────────────────────────────

server.tool(
  "ops_runbook_start",
  "Start a runbook execution for a project",
  {
    project_id: z.string().describe("Project ID"),
    runbook_name: z.string().describe("Name of the runbook to execute"),
    total_steps: z.number().describe("Total number of steps in the runbook"),
  },
  async (params) => {
    try {
      const execution = startRunbook(params);
      return { content: [{ type: "text", text: JSON.stringify(execution, null, 2) }] };
    } catch (err) {
      log.error("ops_runbook_start failed", err);
      return { content: [{ type: "text", text: `Error: ${err}` }], isError: true };
    }
  },
);

server.tool(
  "ops_runbook_get",
  "Get a runbook execution by ID",
  { id: z.string().describe("Execution ID") },
  async ({ id }) => {
    const execution = getRunbookExecution(id);
    if (!execution) return { content: [{ type: "text", text: "Execution not found" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(execution, null, 2) }] };
  },
);

server.tool(
  "ops_runbook_list",
  "List runbook executions with optional filters",
  {
    project_id: z.string().optional(),
    status: z.enum(["running", "completed", "failed"]).optional(),
    runbook_name: z.string().optional(),
  },
  async (filters) => {
    const filtered = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined),
    ) as Parameters<typeof listRunbookExecutions>[0];
    const executions = listRunbookExecutions(filtered);
    return { content: [{ type: "text", text: JSON.stringify(executions, null, 2) }] };
  },
);

server.tool(
  "ops_runbook_step",
  "Log a completed step in a runbook execution",
  {
    id: z.string().describe("Execution ID"),
    name: z.string().describe("Step name"),
    status: z.string().describe("Step status (pass/fail/skip)"),
    message: z.string().describe("Step result message"),
    duration_ms: z.number().optional().describe("Step duration in milliseconds"),
  },
  async ({ id, ...step }) => {
    const execution = logRunbookStep(id, step);
    if (!execution) return { content: [{ type: "text", text: "Execution not found" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(execution, null, 2) }] };
  },
);

server.tool(
  "ops_runbook_complete",
  "Mark a runbook execution as completed or failed",
  {
    id: z.string().describe("Execution ID"),
    status: z.enum(["completed", "failed"]).describe("Final status"),
    error: z.string().optional().describe("Error message if failed"),
  },
  async ({ id, status, error }) => {
    const execution = completeRunbook(id, status, error);
    if (!execution) return { content: [{ type: "text", text: "Execution not found" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(execution, null, 2) }] };
  },
);

// ── Resources (3) ───────────────────────────────────────────────

server.resource("projects", "ops://projects", async () => {
  const projects = listProjects();
  return {
    contents: [
      {
        uri: "ops://projects",
        mimeType: "application/json",
        text: JSON.stringify(projects, null, 2),
      },
    ],
  };
});

server.resource("health", "ops://health", async () => {
  const projects = listProjects();
  const latestChecks = projects
    .map((p) => {
      const check = getLatestHealthCheck(p.id);
      return check ? { ...check, project_name: p.name } : null;
    })
    .filter(Boolean);
  return {
    contents: [
      {
        uri: "ops://health",
        mimeType: "application/json",
        text: JSON.stringify(latestChecks, null, 2),
      },
    ],
  };
});

server.resource("issues", "ops://issues", async () => {
  const issues = listIssues({ status: "open" });
  return {
    contents: [
      {
        uri: "ops://issues",
        mimeType: "application/json",
        text: JSON.stringify(issues, null, 2),
      },
    ],
  };
});

// ── Start ───────────────────────────────────────────────────────

async function main() {
  log.info("Ops MCP server starting");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info("Ops MCP server connected");
}

main().catch((err) => {
  log.error("Ops MCP server fatal error", err);
  process.exit(1);
});
