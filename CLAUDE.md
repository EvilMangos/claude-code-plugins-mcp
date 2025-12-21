# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP (Model Context Protocol) server for Claude Code plugins data storage and retrieval. Built with TypeScript, uses the `@modelcontextprotocol/sdk` for MCP server implementation and Zod v4 for schema validation.

## Commands

```bash
# Build
pnpm run build

# Run the MCP server
pnpm run start

# Development with watch mode
pnpm run dev

# Test with MCP Inspector
pnpm run inspect

# Lint and format
pnpm run lint
pnpm run lint:fix
pnpm run format

# Tests
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test -- src/tools/__tests__/save-report.test.ts  # Run single test file
```

## Architecture

The server uses stdio transport for MCP communication:

- **Entry point**: `src/index.ts` - Creates McpServer and connects via StdioServerTransport
- **Tool registration**: `src/tools/register.ts` - Registers MCP tools with Zod schemas
- **Tool schemas**: `src/tools/schemas/` - Extracted Zod validation schemas (e.g., `save-report.schema.ts`, `get-report.schema.ts`, `shared.schema.ts`). Shared schemas like `taskIdSchema` are reused across tool schemas.
- **Types**: `src/types/` - Shared types and constants (e.g., `report-types.ts` exports `REPORT_TYPES` constant and `ReportType` type)
- **Storage**: Two-layer architecture for report persistence:
  - `src/storage/report-repository.ts` - **Public interface** for tool handlers. Singleton `reportRepository` provides `save(taskId, reportType, content)`, `get(taskId, reportType)`, and `clear()` methods. Handles timestamp generation internally.
  - `src/storage/report-storage.ts` - **Internal implementation**. In-memory storage using Map with composite keys (`{taskId}:{reportType}`). Should not be imported directly by tool handlers.
- **Utilities**: `src/utils/` - Shared helper functions (e.g., `format-zod-error.ts`, `format-storage-error.ts`)

The `reportType` must be one of the 12 valid workflow stages defined in `REPORT_TYPES`.

### Adding New Tools

1. Create Zod schema in `src/tools/schemas/{tool-name}.schema.ts`
2. Create handler in `src/tools/{tool-name}.ts` importing the schema
3. Register in `src/tools/register.ts` using `server.registerTool(name, { description, inputSchema }, handler)`

## Testing Conventions

- Tests located in `__tests__/` directories alongside source
- Uses Vitest with globals enabled
- Test helpers in `src/__tests__/helpers/`
- Tests excluded from TypeScript compilation via tsconfig

## Pre-commit Hooks

Husky runs on commit: `pnpm run format` → `pnpm run lint:fix` → `git add -u`

## MCP

- Use `server.registerTool` not `server.tool`.

## Code style

### Naming
- Use descriptive names for interfaces without prefix, e.g. `StoredReport`, `SaveReportResult`

## Code organization

- Keep interfaces/types and implementation in different files.
- Avoid keeping several elements in a single file. For example:

Example of Good grouping in a single file:
```typescript
export const REPORT_TYPES = [
	"requirements",
	"plan",
	"tests-design",
	"tests-review",
	"implementation",
	"stabilization",
	"acceptance",
	"performance",
	"security",
	"refactoring",
	"code-review",
	"documentation",
] as const;

/**
 * Type derived from REPORT_TYPES constant.
 */
export type ReportType = (typeof REPORT_TYPES)[number];
```

The reason why these elements should be kept together is because they are related very much, and they are too small to keep them separately.

Example of bad grouping in a single file:

```typescript
// BAD: Mixing unrelated concerns - storage implementation with HTTP utilities
export class ReportStorage { /* ... */ }
export function formatHttpResponse() { /* ... */ }
export const HTTP_STATUS_CODES = { /* ... */ };
```

The issue in code above is that storage logic and HTTP utilities serve different purposes and should be in separate files.