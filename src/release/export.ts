import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getProjectDir } from "../lib/paths.js";
import { getDb } from "../db.js";
import { getRelease, listReleases } from "./crud.js";
import { getProject } from "../project/crud.js";
import type { ReleaseRecord } from "../types.js";

function formatDate(iso: string): string {
  return iso.replace(/T.*$/, "");
}

function renderReleaseEntry(release: ReleaseRecord): string {
  const lines: string[] = [
    `## [${release.version}] - ${formatDate(release.created_at)}`,
    "",
  ];

  if (release.changelog) {
    lines.push(release.changelog, "");
  }

  const bumped: string[] = JSON.parse(release.files_bumped);
  if (bumped.length > 0) {
    lines.push("**Files bumped:**", "");
    for (const f of bumped) {
      lines.push(`- ${f}`);
    }
    lines.push("");
  }

  if (release.git_tag) {
    lines.push(`**Tag:** ${release.git_tag}`);
    if (release.commit_sha) {
      lines.push(`**Commit:** ${release.commit_sha.slice(0, 7)}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export interface ExportChangelogResult {
  file_path: string;
  releases_exported: number;
}

export function exportChangelog(
  projectId: string,
  options?: { targetPath?: string; overwrite?: boolean },
): ExportChangelogResult {
  const project = getProject(projectId);
  if (!project) throw new Error("Project not found");

  const releases = listReleases(projectId);
  if (releases.length === 0) throw new Error("No releases found for project");

  const projectDir = getProjectDir();
  const relativePath = options?.targetPath ?? "CHANGELOG.md";
  const absPath = join(projectDir, relativePath);

  if (existsSync(absPath) && !options?.overwrite) {
    throw new Error(`File already exists: ${relativePath}. Use overwrite=true or provide a different target_path.`);
  }

  mkdirSync(dirname(absPath), { recursive: true });

  const header = `# Changelog\n\nAll notable changes to **${project.name}** will be documented in this file.\n\n`;
  const body = releases.map(renderReleaseEntry).join("---\n\n");
  writeFileSync(absPath, header + body, "utf-8");

  // Update published_at and file_path for all exported releases
  const now = new Date().toISOString();
  const db = getDb();
  const stmt = db.prepare("UPDATE releases SET published_at = ?, file_path = ? WHERE id = ?");
  for (const r of releases) {
    stmt.run(now, relativePath, r.id);
  }

  return { file_path: relativePath, releases_exported: releases.length };
}
