/**
 * Test utilities for MCP server testing.
 *
 * This module provides helper functions and types to reduce duplication
 * in MCP tool registration tests.
 */

import "reflect-metadata";
import type { Container } from "inversify";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

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
 * Interface for the get-report tool definition as retrieved from _registeredTools.
 */
export interface GetReportToolDefinition {
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
 * Gets the get-report tool from the registered tools with proper typing.
 * @param server - The McpServer instance with tools registered.
 * @returns The get-report tool definition.
 */
export function getGetReportTool(server: McpServer): GetReportToolDefinition {
	const registeredTools = getRegisteredTools(server);
	return registeredTools["get-report"] as GetReportToolDefinition;
}

/**
 * Result of setupTestServerWithTools containing useful objects for testing.
 */
export interface TestServerSetup {
	server: McpServer;
	registeredTools: RegisteredTools;
	saveReportTool: SaveReportToolDefinition;
	getReportTool: GetReportToolDefinition;
	container: Container;
}

/**
 * Extracts the shape from a Zod input schema.
 * Handles both Zod v4 schema structures where shape may be directly accessible
 * or available via _def.shape() function.
 * @param inputSchema - The input schema from a tool definition.
 * @returns The schema shape object, or undefined if not extractable.
 */
export function extractSchemaShape(
	inputSchema: SaveReportToolDefinition["inputSchema"]
): Record<string, unknown> | undefined {
	if (!inputSchema || typeof inputSchema !== "object") {
		return undefined;
	}

	// Zod v4 schemas expose shape directly or via _def.shape()
	if ("shape" in inputSchema && inputSchema.shape) {
		return inputSchema.shape;
	}

	if (
		"_def" in inputSchema &&
		inputSchema._def &&
		typeof inputSchema._def === "object" &&
		"shape" in inputSchema._def
	) {
		const shapeDef = inputSchema._def.shape;
		return typeof shapeDef === "function" ? shapeDef() : shapeDef;
	}

	return undefined;
}

/**
 * Extracts enum values from a Zod enum schema field.
 * Handles Zod enum structures where values are exposed via _def.values or options.
 * @param field - The schema field to extract enum values from.
 * @returns The enum values array, or undefined if not an enum field.
 */
export function extractEnumValues(
	field: unknown
): readonly string[] | undefined {
	if (!field || typeof field !== "object") {
		return undefined;
	}

	const enumField = field as {
		_def?: { values?: readonly string[] };
		options?: readonly string[];
	};

	return enumField._def?.values ?? enumField.options;
}

/**
 * Convenience function that creates a server, imports and registers tools,
 * and returns useful objects for testing.
 * @returns An object containing the server, registered tools, save-report tool, and get-report tool.
 */
export async function setupTestServerWithTools(): Promise<TestServerSetup> {
	// Setup the DI container before registering tools
	const { setupContainer, container } = await import("../../container");
	setupContainer();

	const server = createTestServer();
	const { registerTools } = await import("../../tools/register");
	registerTools(server);

	const registeredTools = getRegisteredTools(server);
	const saveReportTool = getSaveReportTool(server);
	const getReportTool = getGetReportTool(server);

	return { server, registeredTools, saveReportTool, getReportTool, container };
}
