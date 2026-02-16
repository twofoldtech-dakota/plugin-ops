import type { OpsTemplate } from "./index.js";

export const mcpPluginTemplate: OpsTemplate = {
  category: "mcp-plugin",
  description: "Full MCP server checks — build pipeline, dependencies, types, server entry",
  checks: [
    {
      name: "package-json-exists",
      description: "package.json exists with name and version",
      category: "structure",
      weight: 15,
    },
    {
      name: "tsconfig-exists",
      description: "tsconfig.json exists with correct module settings",
      category: "structure",
      weight: 10,
    },
    {
      name: "entry-point-exists",
      description: "Main entry file (src/index.ts) exists and exports MCP server",
      category: "structure",
      weight: 15,
    },
    {
      name: "build-script-exists",
      description: "Build script defined in package.json scripts",
      category: "structure",
      weight: 10,
    },
    {
      name: "build-succeeds",
      description: "npm run build completes without errors",
      category: "quality",
      weight: 15,
    },
    {
      name: "typecheck-passes",
      description: "npm run typecheck passes with no errors",
      category: "quality",
      weight: 10,
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
      weight: 10,
    },
    {
      name: "readme-exists",
      description: "README.md exists in the project root",
      category: "quality",
      weight: 5,
    },
  ],
  recommendations: [
    "Use tsup or similar bundler for reliable ESM builds",
    "Always validate tool parameters with Zod schemas",
    "Include a typecheck script separate from build for CI",
    "Pin @modelcontextprotocol/sdk to a specific minor version",
    "Add structured logging for debugging MCP tool calls",
    "Test the server starts cleanly: node dist/index.js",
  ],
};
