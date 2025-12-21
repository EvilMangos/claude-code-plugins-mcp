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
- **Tool schemas**: `src/tools/schemas/` - Extracted Zod validation schemas (e.g., `save-report.schema.ts`)
- **Storage types**: `src/storage/types.ts` - Shared constants and types (e.g., `FILE_TYPES`, `FileType`)
- **Storage**: `src/storage/report-storage.ts` - In-memory storage using Map with composite keys (`{taskId}:{reportType}:{fileType}`)
- **Utilities**: `src/utils/` - Shared helper functions (e.g., `format-zod-error.ts`)

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
