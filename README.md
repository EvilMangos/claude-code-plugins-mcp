# Claude Code Plugins MCP

MCP (Model Context Protocol) server for Claude Code plugins workflow data storage and retrieval.

## Overview

This server provides tools for storing and retrieving workflow reports and signals during Claude Code plugin execution. It enables plugins to persist state across different workflow steps such as requirements gathering, planning, implementation, testing, and code review.

## Related Projects

This MCP server is designed to work with [claude-code-plugins](https://github.com/EvilMangos/claude-code-plugins) - a collection of workflow plugins for Claude Code that use this server for state persistence.

## Installation

```bash
pnpm install
pnpm run build
```

## Usage

### Configure with Claude Code

Add this server to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "claude-code-plugins-mcp": {
      "command": "node",
      "args": ["@evil-mango/claude-code-plugins-mcp"]
    }
  }
}
```

### Available Tools

#### `save-report`

Save a workflow report for a specific task and step.

**Parameters:**
- `taskId` (string, required) - Unique identifier for the task
- `reportType` (string, required) - One of the valid workflow steps
- `content` (string, required) - Report content to save

#### `get-report`

Retrieve a previously saved workflow report.

**Parameters:**
- `taskId` (string, required) - Unique identifier for the task
- `reportType` (string, required) - One of the valid workflow steps

#### `save-signal`

Save a workflow signal with status and summary for a specific task and step.

**Parameters:**
- `taskId` (string, required) - Unique identifier for the task
- `signalType` (string, required) - One of the valid workflow steps
- `status` (string, required) - Signal status: `"passed"` or `"failed"`
- `summary` (string, required) - Brief summary of the signal

#### `wait-signal`

Wait for a workflow signal to appear. Polls until the signal is found or timeout is reached.

**Parameters:**
- `taskId` (string, required) - Unique identifier for the task
- `signalType` (string or array, required) - Workflow step(s) to wait for. Can be a single step or an array for parallel steps.
- `timeoutMs` (number, optional) - Maximum wait time in milliseconds (default: 30000, max: 600000)
- `pollIntervalMs` (number, optional) - Polling interval in milliseconds (default: 1000, min: 100, max: 60000)

#### `create-metadata`

Create task lifecycle metadata with execution steps.

**Parameters:**
- `taskId` (string, required) - Unique identifier for the workflow task
- `executionSteps` (array, required) - Ordered list of workflow steps to execute. Use arrays for parallel steps: `['plan', ['performance', 'security'], 'refactoring']`

#### `get-next-step`

Get the next workflow step for a task.

**Parameters:**
- `taskId` (string, required) - Unique identifier for the workflow task

### Valid Report/Signal Types

Reports and signals can be saved for the following workflow steps:

| Step             | Description |
|------------------|-------------|
| `requirements`   | Requirements analysis |
| `plan`           | Implementation planning |
| `tests-design`   | Test design phase |
| `tests-review`   | Test review phase |
| `implementation` | Code implementation |
| `stabilization`  | Bug fixing and stabilization |
| `acceptance`     | Acceptance testing |
| `performance`    | Performance review |
| `security`       | Security review |
| `refactoring`    | Code refactoring |
| `code-review`    | Code review |
| `documentation`  | Documentation updates |

## Development

```bash
# Build
pnpm run build

# Development with watch mode
pnpm run dev

# Run tests
pnpm test
pnpm test:watch

# Test with MCP Inspector
pnpm run inspect

# Lint and format
pnpm run lint
pnpm run lint:fix
pnpm run format
```

## Architecture

- **Transport**: stdio-based MCP communication
- **Validation**: Zod v4 schemas for input validation
- **Storage**: SQLite with `better-sqlite3` (defaults to `mcp-storage.db` in CWD)
- **DI**: Inversify for dependency injection

```
src/
├── index.ts                    # Entry point
├── container/                  # DI container setup
├── tools/
│   └── register.ts             # Tool registration
├── schemas/                    # Shared Zod validation schemas
├── storage/                    # SQLite database infrastructure
├── report/                     # Report module (schemas, repository, service)
├── signal/                     # Signal module (schemas, repository, service)
├── metadata/                   # Metadata module (schemas, repository, service)
├── types/                      # Shared TypeScript interfaces
└── utils/                      # Helper functions
```

## Requirements

- Node.js >= 18
- pnpm

## License

MIT
