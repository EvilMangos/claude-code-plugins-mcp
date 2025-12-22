# Claude Code Plugins MCP

MCP (Model Context Protocol) server for Claude Code plugins workflow data storage and retrieval.

## Overview

This server provides tools for storing and retrieving workflow reports and signals during Claude Code plugin execution. It enables plugins to persist state across different workflow steps such as requirements gathering, planning, implementation, testing, and code review.

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
      "args": ["/path/to/claude-code-plugins-mcp/dist/index.js"]
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

#### `get-signal`

Retrieve a previously saved workflow signal.

**Parameters:**
- `taskId` (string, required) - Unique identifier for the task
- `signalType` (string, required) - One of the valid workflow steps

**Returns:**
- `{ success: true, content: { status, summary } }` when signal exists
- `{ success: true, content: null }` when signal does not exist
- `{ success: false, error: "message" }` on validation or storage error

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
- **Storage**: In-memory storage with composite keys (`{taskId}:{reportType}`)
- **DI**: Inversify for dependency injection

```
src/
├── index.ts                    # Entry point
├── container/                  # DI container setup
├── tools/
│   ├── register.ts             # Tool registration
│   ├── report.service.ts       # Report service implementation
│   └── schemas/                # Zod validation schemas
├── report-repository/          # Storage layer
├── types/                      # TypeScript interfaces
└── utils/                      # Helper functions
```

## Requirements

- Node.js >= 18
- pnpm

## License

MIT
