import { randomUUID } from "node:crypto";
import type { SQLInputValue } from "node:sqlite";
import { getDb } from "../db.js";
import type {
  IssueRecord,
  IssueStatus,
  IssuePriority,
  IssueCategory,
  IssueSource,
} from "../types.js";

export function createIssue(input: {
  project_id: string;
  title: string;
  description?: string;
  priority?: IssuePriority;
  category?: IssueCategory;
  source?: IssueSource;
  health_check_id?: string;
}): IssueRecord {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO issues (id, project_id, health_check_id, title, description, priority, category, source, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.project_id,
    input.health_check_id ?? null,
    input.title,
    input.description ?? "",
    input.priority ?? "medium",
    input.category ?? "bug",
    input.source ?? "manual",
    now,
    now,
  );

  return getIssue(id)!;
}

export function getIssue(id: string): IssueRecord | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM issues WHERE id = ?").get(id) as unknown as IssueRecord | undefined;
}

export function listIssues(filters?: {
  project_id?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  category?: IssueCategory;
}): IssueRecord[] {
  const db = getDb();
  const conditions: string[] = [];
  const values: SQLInputValue[] = [];

  if (filters?.project_id) {
    conditions.push("project_id = ?");
    values.push(filters.project_id);
  }
  if (filters?.status) {
    conditions.push("status = ?");
    values.push(filters.status);
  }
  if (filters?.priority) {
    conditions.push("priority = ?");
    values.push(filters.priority);
  }
  if (filters?.category) {
    conditions.push("category = ?");
    values.push(filters.category);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return db
    .prepare(`SELECT * FROM issues ${where} ORDER BY created_at DESC`)
    .all(...values) as unknown as IssueRecord[];
}

export function updateIssue(
  id: string,
  updates: Partial<Omit<IssueRecord, "id" | "project_id" | "created_at">>,
): IssueRecord | undefined {
  const db = getDb();
  const existing = getIssue(id);
  if (!existing) return undefined;

  const fields: string[] = [];
  const values: SQLInputValue[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key === "updated_at") continue;
    fields.push(`${key} = ?`);
    values.push(value as SQLInputValue);
  }

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  db.prepare(`UPDATE issues SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getIssue(id);
}

export function closeIssue(id: string, resolution: string): IssueRecord | undefined {
  return updateIssue(id, { status: "closed", resolution });
}

export function deleteIssue(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM issues WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getIssueStats(projectId?: string): {
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_category: Record<string, number>;
  total: number;
} {
  const db = getDb();
  const where = projectId ? "WHERE project_id = ?" : "";
  const args = projectId ? [projectId] : [];

  const all = db
    .prepare(`SELECT status, priority, category FROM issues ${where}`)
    .all(...args) as unknown as Array<{ status: string; priority: string; category: string }>;

  const by_status: Record<string, number> = {};
  const by_priority: Record<string, number> = {};
  const by_category: Record<string, number> = {};

  for (const row of all) {
    by_status[row.status] = (by_status[row.status] ?? 0) + 1;
    by_priority[row.priority] = (by_priority[row.priority] ?? 0) + 1;
    by_category[row.category] = (by_category[row.category] ?? 0) + 1;
  }

  return { by_status, by_priority, by_category, total: all.length };
}
