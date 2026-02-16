// ── Project ─────────────────────────────────────────────────────

export type ProjectType = "skill-only" | "mcp" | "full";

export interface ProjectRecord {
  id: string;
  name: string;
  type: ProjectType;
  path: string | null;
  version: string | null;
  description: string;
  has_skills: number; // 0/1
  has_mcp: number; // 0/1
  has_hooks: number; // 0/1
  has_agents: number; // 0/1
  metadata: string; // JSON object
  created_at: string;
  updated_at: string;
}

// ── Health Check ────────────────────────────────────────────────

export type HealthStatus = "pass" | "warning" | "fail";

export interface HealthCheckRecord {
  id: string;
  project_id: string;
  status: HealthStatus;
  score: number; // 0-100
  checks: string; // JSON array of {name, status, message, details}
  summary: string;
  published_at: string | null;
  file_path: string | null;
  created_at: string;
}

// ── Issue ───────────────────────────────────────────────────────

export type IssueStatus = "open" | "in_progress" | "closed";
export type IssuePriority = "critical" | "high" | "medium" | "low";
export type IssueCategory =
  | "bug"
  | "dependency"
  | "quality"
  | "structure"
  | "feature"
  | "tech-debt";
export type IssueSource = "manual" | "health-scan";

export interface IssueRecord {
  id: string;
  project_id: string;
  health_check_id: string | null;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  category: IssueCategory;
  source: IssueSource;
  resolution: string | null;
  created_at: string;
  updated_at: string;
}

// ── Release ─────────────────────────────────────────────────────

export type ReleaseType = "major" | "minor" | "patch";

export interface ReleaseRecord {
  id: string;
  project_id: string;
  version: string;
  type: ReleaseType;
  changelog: string;
  files_bumped: string; // JSON array of file paths
  git_tag: string | null;
  commit_sha: string | null;
  published_at: string | null;
  file_path: string | null;
  created_at: string;
}

// ── Runbook Execution ───────────────────────────────────────────

export type RunbookStatus = "running" | "completed" | "failed";

export interface RunbookExecutionRecord {
  id: string;
  project_id: string;
  runbook_name: string;
  status: RunbookStatus;
  steps_completed: number;
  total_steps: number;
  log: string; // JSON array of step logs
  error: string | null;
  started_at: string;
  completed_at: string | null;
}
