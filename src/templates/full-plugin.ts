import type { OpsTemplate } from "./index.js";

export const fullPluginTemplate: OpsTemplate = {
  category: "full-plugin",
  description: "All checks — skills, MCP server, hooks, agents, build, deps, and docs",
  checks: [
    {
      name: "package-json-exists",
      description: "package.json exists with name and version",
      category: "structure",
      weight: 10,
    },
    {
      name: "tsconfig-exists",
      description: "tsconfig.json exists with correct module settings",
      category: "structure",
      weight: 5,
    },
    {
      name: "entry-point-exists",
      description: "Main entry file (src/index.ts) exists and exports MCP server",
      category: "structure",
      weight: 10,
    },
    {
      name: "build-succeeds",
      description: "npm run build completes without errors",
      category: "quality",
      weight: 10,
    },
    {
      name: "typecheck-passes",
      description: "npm run typecheck passes with no errors",
      category: "quality",
      weight: 10,
    },
    {
      name: "skill-files-exist",
      description: "At least one SKILL.md file exists in the skills directory",
      category: "structure",
      weight: 10,
    },
    {
      name: "skill-frontmatter-valid",
      description: "All SKILL.md files have valid frontmatter",
      category: "quality",
      weight: 5,
    },
    {
      name: "hooks-valid",
      description: "Hook definitions in .claude-plugin are valid JSON with correct event types",
      category: "structure",
      weight: 5,
    },
    {
      name: "agents-valid",
      description: "Agent definitions reference valid tools and have proper configurations",
      category: "structure",
      weight: 5,
    },
    {
      name: "mcp-sdk-installed",
      description: "@modelcontextprotocol/sdk is in dependencies",
      category: "dependency",
      weight: 5,
    },
    {
      name: "no-outdated-deps",
      description: "No critically outdated dependencies",
      category: "dependency",
      weight: 5,
    },
    {
      name: "plugin-manifest-exists",
      description: ".claude-plugin directory with manifest files exists",
      category: "structure",
      weight: 5,
    },
    {
      name: "readme-exists",
      description: "README.md exists in the project root",
      category: "quality",
      weight: 5,
    },
    {
      name: "examples-present",
      description: "Supporting examples or patterns doc exists alongside skills",
      category: "quality",
      weight: 5,
    },
    {
      name: "architecture-doc-exists",
      description: "ARCHITECTURE.md or equivalent documentation exists",
      category: "quality",
      weight: 5,
    },
  ],
  recommendations: [
    "Use a monorepo-friendly structure if combining skills, MCP, hooks, and agents",
    "Keep hooks lightweight — they run on every matching event",
    "Document agent tool access carefully in allowed-tools frontmatter",
    "Run full health scans before each release",
    "Include an ARCHITECTURE.md explaining component relationships",
    "Test the complete plugin lifecycle: install → configure → invoke → verify",
    "Use blueprints to automate multi-step maintenance workflows",
  ],
};
