import type { OpsTemplate } from "./index.js";

export const skillOnlyTemplate: OpsTemplate = {
  category: "skill-only",
  description: "Health checks for skill-only plugins — no build pipeline, no MCP dependencies",
  checks: [
    {
      name: "skill-file-exists",
      description: "SKILL.md file exists in the skills directory",
      category: "structure",
      weight: 20,
    },
    {
      name: "skill-frontmatter-valid",
      description: "SKILL.md has valid frontmatter (name, description, allowed-tools)",
      category: "quality",
      weight: 15,
    },
    {
      name: "skill-description-present",
      description: "Skill has a non-empty description field",
      category: "quality",
      weight: 10,
    },
    {
      name: "plugin-manifest-exists",
      description: ".claude-plugin directory with manifest files exists",
      category: "structure",
      weight: 20,
    },
    {
      name: "readme-exists",
      description: "README.md exists in the project root",
      category: "quality",
      weight: 10,
    },
    {
      name: "license-exists",
      description: "LICENSE file exists",
      category: "quality",
      weight: 5,
    },
    {
      name: "no-broken-tool-refs",
      description: "All tool references in allowed-tools are valid patterns",
      category: "quality",
      weight: 10,
    },
    {
      name: "examples-present",
      description: "Supporting examples or patterns doc exists alongside skill",
      category: "quality",
      weight: 10,
    },
  ],
  recommendations: [
    "Keep skill files focused — one skill per concern",
    "Include worked examples alongside SKILL.md for better LLM context",
    "Use allowed-tools to restrict tool access to only what the skill needs",
    "Add argument-hint frontmatter for better CLI discoverability",
    "Test skill invocation with /skill-name to verify routing works",
  ],
};
