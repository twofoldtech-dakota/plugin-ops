import { appendFileSync, statSync, renameSync } from "node:fs";
import { getLogPath } from "./paths.js";

const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB

type LogLevel = "debug" | "info" | "warn" | "error";

function rotate(path: string): void {
  try {
    const stat = statSync(path);
    if (stat.size > MAX_LOG_SIZE) {
      renameSync(path, `${path}.old`);
    }
  } catch {
    // File doesn't exist yet
  }
}

function write(level: LogLevel, message: string, data?: unknown): void {
  const path = getLogPath();
  rotate(path);

  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...(data !== undefined ? { data } : {}),
  });

  appendFileSync(path, entry + "\n");
}

export const log = {
  debug: (msg: string, data?: unknown) => write("debug", msg, data),
  info: (msg: string, data?: unknown) => write("info", msg, data),
  warn: (msg: string, data?: unknown) => write("warn", msg, data),
  error: (msg: string, data?: unknown) => write("error", msg, data),
};
