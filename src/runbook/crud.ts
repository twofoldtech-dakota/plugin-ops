import { randomUUID } from "node:crypto";
import { getDb } from "../db.js";
import type { RunbookExecutionRecord, RunbookStatus } from "../types.js";

export function startRunbook(input: {
  project_id: string;
  runbook_name: string;
  total_steps: number;
}): RunbookExecutionRecord {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO runbook_executions (id, project_id, runbook_name, status, steps_completed, total_steps, log, started_at)
    VALUES (?, ?, ?, 'running', 0, ?, '[]', ?)
  `).run(
    id,
    input.project_id,
    input.runbook_name,
    input.total_steps,
    now,
  );

  return getRunbookExecution(id)!;
}

export function getRunbookExecution(id: string): RunbookExecutionRecord | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM runbook_executions WHERE id = ?").get(id) as unknown as RunbookExecutionRecord | undefined;
}

export function listRunbookExecutions(filters?: {
  project_id?: string;
  status?: RunbookStatus;
  runbook_name?: string;
}): RunbookExecutionRecord[] {
  const db = getDb();
  const conditions: string[] = [];
  const values: string[] = [];

  if (filters?.project_id) {
    conditions.push("project_id = ?");
    values.push(filters.project_id);
  }
  if (filters?.status) {
    conditions.push("status = ?");
    values.push(filters.status);
  }
  if (filters?.runbook_name) {
    conditions.push("runbook_name = ?");
    values.push(filters.runbook_name);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return db
    .prepare(`SELECT * FROM runbook_executions ${where} ORDER BY started_at DESC`)
    .all(...values) as unknown as RunbookExecutionRecord[];
}

export function logRunbookStep(
  id: string,
  step: { name: string; status: string; message: string; duration_ms?: number },
): RunbookExecutionRecord | undefined {
  const db = getDb();
  const existing = getRunbookExecution(id);
  if (!existing) return undefined;

  const logs: Array<Record<string, unknown>> = JSON.parse(existing.log);
  logs.push({ ...step, timestamp: new Date().toISOString() });

  db.prepare(`
    UPDATE runbook_executions
    SET steps_completed = steps_completed + 1, log = ?
    WHERE id = ?
  `).run(JSON.stringify(logs), id);

  return getRunbookExecution(id);
}

export function completeRunbook(
  id: string,
  status: "completed" | "failed",
  error?: string,
): RunbookExecutionRecord | undefined {
  const db = getDb();
  const existing = getRunbookExecution(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE runbook_executions
    SET status = ?, completed_at = ?, error = ?
    WHERE id = ?
  `).run(status, now, error ?? null, id);

  return getRunbookExecution(id);
}
