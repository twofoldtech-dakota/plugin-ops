import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { SQLInputValue } from "node:sqlite";
import { getDb } from "../db.js";
import type { ProjectRecord, ProjectType } from "../types.js";

export function createProject(input: {
  name: string;
  type?: ProjectType;
  path?: string;
  version?: string;
  description?: string;
  has_skills?: number;
  has_mcp?: number;
  has_hooks?: number;
  has_agents?: number;
  metadata?: Record<string, unknown>;
}): ProjectRecord {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO projects (id, name, type, path, version, description, has_skills, has_mcp, has_hooks, has_agents, metadata, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.name,
    input.type ?? "skill-only",
    input.path ?? null,
    input.version ?? null,
    input.description ?? "",
    input.has_skills ?? 0,
    input.has_mcp ?? 0,
    input.has_hooks ?? 0,
    input.has_agents ?? 0,
    JSON.stringify(input.metadata ?? {}),
    now,
    now,
  );

  return getProject(id)!;
}

export function getProject(id: string): ProjectRecord | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as unknown as ProjectRecord | undefined;
}

export function listProjects(): ProjectRecord[] {
  const db = getDb();
  return db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all() as unknown as ProjectRecord[];
}

export function updateProject(
  id: string,
  updates: Partial<Omit<ProjectRecord, "id" | "created_at">>,
): ProjectRecord | undefined {
  const db = getDb();
  const existing = getProject(id);
  if (!existing) return undefined;

  const fields: string[] = [];
  const values: SQLInputValue[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key === "updated_at") continue;
    fields.push(`${key} = ?`);
    values.push(
      (typeof value === "object" && value !== null ? JSON.stringify(value) : value) as SQLInputValue,
    );
  }

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  db.prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getProject(id);
}

export function deleteProject(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  return result.changes > 0;
}

export function detectProject(projectPath: string): {
  has_skills: number;
  has_mcp: number;
  has_hooks: number;
  has_agents: number;
  type: ProjectType;
  version: string | null;
  name: string | null;
  description: string | null;
} {
  let has_skills = 0;
  let has_mcp = 0;
  let has_hooks = 0;
  let has_agents = 0;
  let version: string | null = null;
  let name: string | null = null;
  let description: string | null = null;

  // Check for skills
  if (existsSync(join(projectPath, "skills"))) {
    has_skills = 1;
  }

  // Check for MCP server
  if (
    existsSync(join(projectPath, ".mcp.json")) ||
    existsSync(join(projectPath, "src", "index.ts"))
  ) {
    has_mcp = 1;
  }

  // Check for hooks
  if (existsSync(join(projectPath, ".claude", "settings.json"))) {
    try {
      const settings = JSON.parse(
        readFileSync(join(projectPath, ".claude", "settings.json"), "utf-8"),
      );
      if (settings.hooks && Object.keys(settings.hooks).length > 0) {
        has_hooks = 1;
      }
    } catch {
      // ignore
    }
  }

  // Check for agents
  if (existsSync(join(projectPath, "agents"))) {
    has_agents = 1;
  }

  // Read package.json for version/name/description
  try {
    const pkg = JSON.parse(
      readFileSync(join(projectPath, "package.json"), "utf-8"),
    );
    version = pkg.version ?? null;
    name = pkg.name ?? null;
    description = pkg.description ?? null;
  } catch {
    // ignore
  }

  // Read plugin.json for version/name if package.json didn't have it
  try {
    const plugin = JSON.parse(
      readFileSync(join(projectPath, ".claude-plugin", "plugin.json"), "utf-8"),
    );
    if (!version) version = plugin.version ?? null;
    if (!name) name = plugin.name ?? null;
    if (!description) description = plugin.description ?? null;
  } catch {
    // ignore
  }

  // Determine type
  let type: ProjectType = "skill-only";
  if (has_mcp && has_skills) {
    type = "full";
  } else if (has_mcp) {
    type = "mcp";
  }

  return { has_skills, has_mcp, has_hooks, has_agents, type, version, name, description };
}
