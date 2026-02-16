export interface OpsTemplate {
  category: string;
  description: string;
  checks: Array<{ name: string; description: string; category: string; weight: number }>;
  recommendations: string[];
}

import { skillOnlyTemplate } from "./skill-only.js";
import { mcpPluginTemplate } from "./mcp-plugin.js";
import { fullPluginTemplate } from "./full-plugin.js";

const templates: Map<string, OpsTemplate> = new Map([
  ["skill-only", skillOnlyTemplate],
  ["mcp-plugin", mcpPluginTemplate],
  ["full-plugin", fullPluginTemplate],
]);

export function listTemplates(): Array<{ category: string; description: string }> {
  return Array.from(templates.values()).map((t) => ({
    category: t.category,
    description: t.description,
  }));
}

export function getTemplate(category: string): OpsTemplate | undefined {
  return templates.get(category);
}
