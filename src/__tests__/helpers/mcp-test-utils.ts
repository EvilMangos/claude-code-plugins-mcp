/**
 * Test utilities for MCP server testing.
 *
 * This module provides helper functions and types to reduce duplication
 * in MCP tool registration tests.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

/**
 * Type for the internal _registeredTools object on McpServer.
 * Used to access registered tools for testing purposes.
 */
export type RegisteredTools = Record<string, unknown>;

/**
 * Type for a tool handler function signature.
 */
export type ToolHandler = (
	args: Record<string, unknown>,
	extra: unknown
) => Promise<{ content: Array<{ type: string; text: string }> }>;

/**
 * Interface for the save-report tool definition as retrieved from _registeredTools.
 */
export interface SaveReportToolDefinition {
	handler?: ToolHandler;
	inputSchema?: {
		shape?: Record<string, unknown>;
		_def?: { shape?: () => Record<string, unknown> };
	};
	description?: string;
}

/**
 * Creates a fresh McpServer instance for testing.
 * @returns A new McpServer configured for testing.
 */
export function createTestServer(): McpServer {
	return new McpServer({
		name: "test-server",
		version: "0.1.0",
	});
}

/**
 * Accesses the internal _registeredTools object on an McpServer.
 * This performs the necessary type cast to access the private property.
 * @param server - The McpServer instance to extract tools from.
 * @returns The registered tools record.
 */
export function getRegisteredTools(server: McpServer): RegisteredTools {
	return (server as unknown as { _registeredTools: RegisteredTools })
		._registeredTools;
}

/**
 * Gets the save-report tool from the registered tools with proper typing.
 * @param server - The McpServer instance with tools registered.
 * @returns The save-report tool definition.
 */
export function getSaveReportTool(server: McpServer): SaveReportToolDefinition {
	const registeredTools = getRegisteredTools(server);
	return registeredTools["save-report"] as SaveReportToolDefinition;
}

/**
 * Result of setupTestServerWithTools containing useful objects for testing.
 */
export interface TestServerSetup {
	server: McpServer;
	registeredTools: RegisteredTools;
	saveReportTool: SaveReportToolDefinition;
}

/**
 * Convenience function that creates a server, imports and registers tools,
 * and returns useful objects for testing.
 * @returns An object containing the server, registered tools, and save-report tool.
 */
export async function setupTestServerWithTools(): Promise<TestServerSetup> {
	const server = createTestServer();
	const { registerTools } = await import("../../tools/register");
	registerTools(server);

	const registeredTools = getRegisteredTools(server);
	const saveReportTool = getSaveReportTool(server);

	return { server, registeredTools, saveReportTool };
}
