import { DatabaseSync } from "node:sqlite";
import { getDbPath } from "./lib/paths.js";
import { log } from "./lib/logger.js";

let db: DatabaseSync | null = null;
let connectedAt = 0;
const TTL = 5_000;

export function getDb(): DatabaseSync {
  const now = Date.now();
  if (db && now - connectedAt < TTL) return db;
  if (db) {
    try {
      db.close();
    } catch {
      // ignore
    }
  }
  const path = getDbPath();
  db = new DatabaseSync(path);
  connectedAt = now;
  db.exec("PRAGMA journal_mode=WAL");
  db.exec("PRAGMA foreign_keys=ON");
  migrate(db);
  migrateV0_2_0(db);
  log.info("Database connected", { path });
  return db;
}

function migrate(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'skill-only' CHECK(type IN ('skill-only','mcp','full')),
      path TEXT,
      version TEXT,
      description TEXT NOT NULL DEFAULT '',
      has_skills INTEGER NOT NULL DEFAULT 0,
      has_mcp INTEGER NOT NULL DEFAULT 0,
      has_hooks INTEGER NOT NULL DEFAULT 0,
      has_agents INTEGER NOT NULL DEFAULT 0,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS health_checks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pass' CHECK(status IN ('pass','warning','fail')),
      score INTEGER NOT NULL DEFAULT 100,
      checks TEXT NOT NULL DEFAULT '[]',
      summary TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      health_check_id TEXT REFERENCES health_checks(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','closed')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('critical','high','medium','low')),
      category TEXT NOT NULL DEFAULT 'bug' CHECK(category IN ('bug','dependency','quality','structure','feature','tech-debt')),
      source TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','health-scan')),
      resolution TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS releases (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      version TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'patch' CHECK(type IN ('major','minor','patch')),
      changelog TEXT NOT NULL DEFAULT '',
      files_bumped TEXT NOT NULL DEFAULT '[]',
      git_tag TEXT,
      commit_sha TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS runbook_executions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      runbook_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running','completed','failed')),
      steps_completed INTEGER NOT NULL DEFAULT 0,
      total_steps INTEGER NOT NULL DEFAULT 0,
      log TEXT NOT NULL DEFAULT '[]',
      error TEXT,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_health_checks_project ON health_checks(project_id);
    CREATE INDEX IF NOT EXISTS idx_issues_project ON issues(project_id);
    CREATE INDEX IF NOT EXISTS idx_issues_health_check ON issues(health_check_id);
    CREATE INDEX IF NOT EXISTS idx_releases_project ON releases(project_id);
    CREATE INDEX IF NOT EXISTS idx_runbook_executions_project ON runbook_executions(project_id);
  `);
}

function migrateV0_2_0(db: DatabaseSync): void {
  const healthCols = db.prepare("PRAGMA table_info(health_checks)").all() as Array<{ name: string }>;
  const healthNames = new Set(healthCols.map((c) => c.name));
  if (!healthNames.has("published_at")) {
    db.exec("ALTER TABLE health_checks ADD COLUMN published_at TEXT");
  }
  if (!healthNames.has("file_path")) {
    db.exec("ALTER TABLE health_checks ADD COLUMN file_path TEXT");
  }

  const releaseCols = db.prepare("PRAGMA table_info(releases)").all() as Array<{ name: string }>;
  const releaseNames = new Set(releaseCols.map((c) => c.name));
  if (!releaseNames.has("published_at")) {
    db.exec("ALTER TABLE releases ADD COLUMN published_at TEXT");
  }
  if (!releaseNames.has("file_path")) {
    db.exec("ALTER TABLE releases ADD COLUMN file_path TEXT");
  }
}

export function closeDb(): void {
  if (db) {
    try {
      db.close();
    } catch {
      // ignore
    }
    db = null;
  }
}
