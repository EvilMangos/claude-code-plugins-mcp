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
pnpm test -- src/report/__tests__/save-report.test.ts  # Run single test file
```

## Architecture

The server uses stdio transport for MCP communication:

- **Entry point**: `src/index.ts` - Creates McpServer and connects via StdioServerTransport
- **Tool registration**: `src/tools/register.ts` - Registers MCP tools with Zod schemas
- **Common schemas**: `src/schemas/` - Shared Zod validation schemas (e.g., `shared.schema.ts` with `taskIdSchema`)
- **Common types**: `src/types/` - Shared types and constants (e.g., `report.type.ts` exports `REPORT_TYPES` constant and `ReportType` type; `operation-result.interface.ts` for generic operation results)
- **Utilities**: `src/utils/` - Shared helper functions (e.g., `format-zod.error.ts`, `format-error.ts`, `validate-input.ts` for centralized schema validation)
- **Container**: `src/container/` - Inversify dependency injection setup with configuration-driven bindings in `setup.ts`

### Storage Module (`src/storage/`)

Shared SQLite database infrastructure:

- **SqliteDatabase**: `sqlite-database.ts` - Core database manager with lazy initialization using `better-sqlite3`. Creates tables for reports, signals, and metadata on first access. Defaults to `mcp-storage.db` in CWD; supports `:memory:` for testing.

### Report Module (`src/report/`)

Report-related functionality for storing and retrieving workflow reports:

- **Schemas**: `src/report/schemas/` - Zod schemas for save-report and get-report
- **Types**: `src/report/types/` - Report interfaces (storage, service, stored-report, result types, `report-row.interface.ts` for SQLite row structure)
- **Storage**: `src/report/repository/report.repository.ts` - SQLite storage with `save(taskId, reportType, content)`, `get()`, `clear()`. Auto-generates timestamps. Uses composite primary key `(task_id, report_type)` with `INSERT OR REPLACE` for upsert.
- **Service**: `src/report/report.service.ts` - Business logic for report operations

### Signal Module (`src/signal/`)

Signal-related functionality for storing and retrieving workflow signals with status/summary:

- **Schemas**: `src/signal/schemas/` - Zod schemas for save-signal and get-signal
- **Types**: `src/signal/types/` - Signal interfaces, `signal-status.type.ts` (SIGNAL_STATUSES: passed/failed), and `signal-row.interface.ts` for SQLite row structure
- **Storage**: `src/signal/repository/signal.repository.ts` - SQLite storage with `save(taskId, signalType, content)`, `get()`, `clear()`. Auto-generates timestamps. SignalContent is JSON-serialized. Uses composite primary key `(task_id, signal_type)`.
- **Service**: `src/signal/signal.service.ts` - Business logic for signal operations (saveSignal, waitSignal)

### Metadata Module (`src/metadata/`)

Metadata-related functionality for storing workflow execution state:

- **Schemas**: `src/metadata/schemas/` - Zod schemas for create-metadata and get-next-step
- **Types**: `src/metadata/types/` - Metadata interfaces (storage, service, stored-metadata, result types, `metadata-row.interface.ts` for SQLite row structure)
- **Storage**: `src/metadata/repository/metadata.repository.ts` - SQLite storage with `create(taskId, executionSteps)`, `get()`, `exists()`, `incrementStep()`, `decrementStep()`, `clear()`. Auto-generates timestamps. ExecutionSteps array is JSON-serialized. Uses primary key `task_id`.
- **Service**: `src/metadata/metadata.service.ts` - Business logic for metadata operations (createMetadata, getNextStep)

The `reportType`/`signalType` must be one of the 13 valid workflow steps defined in `REPORT_TYPES`.

### Adding New Tools

1. Create Zod schema in the appropriate module's `schemas/` folder
2. Create service with handler logic in the module
3. Register in `src/tools/register.ts` using `server.registerTool(name, { description, inputSchema }, handler)`

## Testing Conventions

- Tests located in `__tests__/` directories alongside source
- Uses Vitest with globals enabled
- Shared test helpers in `src/__tests__/helpers/` (e.g., `mcp-test-utils.ts` with `ToolDefinition` interface)
- Module-specific test helpers in `<module>/__tests__/helpers/` (e.g., `src/signal/__tests__/helpers/signal-test-utils.ts`)
- Tests excluded from TypeScript compilation via tsconfig
- Use `REPORT_TYPES` constant instead of hardcoded lists in parameterized tests

## Pre-commit Hooks

Husky runs on commit: `pnpm run format` → `pnpm run lint:fix` → `git add -u`

## MCP

- Use `server.registerTool` not `server.tool`.

## Code organization

- Keep interfaces/types and implementation in different files.
- Avoid keeping several elements in a single file. For example:

Example of Good grouping in a single file:
```typescript
export const ReportType = {
	REQUIREMENTS: "requirements",
	PLAN: "plan",
	TESTS_DESIGN: "tests-design",
	TESTS_REVIEW: "tests-review",
	IMPLEMENTATION: "implementation",
	STABILIZATION: "stabilization",
	ACCEPTANCE: "acceptance",
	PERFORMANCE: "performance",
	SECURITY: "security",
	REFACTORING: "refactoring",
	CODE_REVIEW: "code-review",
	DOCUMENTATION: "documentation",
} as const;

export type ReportType = (typeof ReportType)[keyof typeof ReportType];

export const REPORT_TYPES = Object.values(ReportType);
```

The reason why these elements should be kept together is because they are related very much, and they are too small to keep them separately.

Example of bad grouping in a single file:

```typescript
// BAD: Mixing unrelated concerns - report-repository implementation with HTTP utilities
export class ReportStorage { /* ... */ }
export function formatHttpResponse() { /* ... */ }
export const HTTP_STATUS_CODES = { /* ... */ };
```

The issue in code above is that storage logic and HTTP utilities serve different purposes and should be in separate files.