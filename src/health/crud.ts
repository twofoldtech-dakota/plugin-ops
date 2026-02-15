import { randomUUID } from "node:crypto";
import { getDb } from "../db.js";
import type { HealthCheckRecord, HealthStatus } from "../types.js";

export function createHealthCheck(input: {
  project_id: string;
  status: HealthStatus;
  score: number;
  checks: Array<{ name: string; status: string; message: string; details?: string }>;
  summary: string;
}): HealthCheckRecord {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO health_checks (id, project_id, status, score, checks, summary, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.project_id,
    input.status,
    input.score,
    JSON.stringify(input.checks),
    input.summary,
    now,
  );

  return getHealthCheck(id)!;
}

export function getHealthCheck(id: string): HealthCheckRecord | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM health_checks WHERE id = ?").get(id) as unknown as HealthCheckRecord | undefined;
}

export function listHealthChecks(projectId: string): HealthCheckRecord[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM health_checks WHERE project_id = ? ORDER BY created_at DESC")
    .all(projectId) as unknown as HealthCheckRecord[];
}

export function getLatestHealthCheck(projectId: string): HealthCheckRecord | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM health_checks WHERE project_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(projectId) as unknown as HealthCheckRecord | undefined;
}
