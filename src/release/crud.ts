import { randomUUID } from "node:crypto";
import type { SQLInputValue } from "node:sqlite";
import { getDb } from "../db.js";
import type { ReleaseRecord, ReleaseType } from "../types.js";

export function createRelease(input: {
  project_id: string;
  version: string;
  type: ReleaseType;
  changelog?: string;
  files_bumped?: string[];
  git_tag?: string;
  commit_sha?: string;
}): ReleaseRecord {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO releases (id, project_id, version, type, changelog, files_bumped, git_tag, commit_sha, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.project_id,
    input.version,
    input.type,
    input.changelog ?? "",
    JSON.stringify(input.files_bumped ?? []),
    input.git_tag ?? null,
    input.commit_sha ?? null,
    now,
  );

  return getRelease(id)!;
}

export function getRelease(id: string): ReleaseRecord | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM releases WHERE id = ?").get(id) as unknown as ReleaseRecord | undefined;
}

export function listReleases(projectId: string): ReleaseRecord[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM releases WHERE project_id = ? ORDER BY created_at DESC")
    .all(projectId) as unknown as ReleaseRecord[];
}

export function getLatestRelease(projectId: string): ReleaseRecord | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM releases WHERE project_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(projectId) as unknown as ReleaseRecord | undefined;
}

export function updateRelease(
  id: string,
  updates: { git_tag?: string; commit_sha?: string },
): ReleaseRecord | undefined {
  const db = getDb();
  const existing = getRelease(id);
  if (!existing) return undefined;

  const fields: string[] = [];
  const values: SQLInputValue[] = [];

  if (updates.git_tag !== undefined) {
    fields.push("git_tag = ?");
    values.push(updates.git_tag);
  }
  if (updates.commit_sha !== undefined) {
    fields.push("commit_sha = ?");
    values.push(updates.commit_sha);
  }

  if (fields.length === 0) return existing;

  values.push(id);
  db.prepare(`UPDATE releases SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getRelease(id);
}
