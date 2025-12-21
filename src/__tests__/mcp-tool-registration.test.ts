import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupTestServerWithTools } from "./helpers/mcp-test-utils.js";

/**
 * Integration tests for MCP tool registration.
 *
 * These tests verify that:
 * 1. The save-report tool is registered with the MCP server
 * 2. The tool can be called through the MCP interface
 *
 * The tests use the actual MCP server instance from index.ts (via dynamic import)
 * to verify end-to-end tool registration.
 */

describe("MCP Server Tool Registration", () => {
	// Store original console.error to restore after tests
	let originalConsoleError: typeof console.error;

	beforeEach(() => {
		// Silence console.error during tests to avoid noise
		originalConsoleError = console.error;
		console.error = vi.fn();
		// Clear module cache to get fresh imports
		vi.resetModules();
	});

	afterEach(() => {
		console.error = originalConsoleError;
	});

	describe("save-report tool registration", () => {
		it("should register save-report tool with the MCP server", async () => {
			const { registeredTools } = await setupTestServerWithTools();

			expect(registeredTools).toBeDefined();
			expect("save-report" in registeredTools).toBe(true);
		});

		it("should register save-report tool with correct schema", async () => {
			const { saveReportTool } = await setupTestServerWithTools();

			expect(saveReportTool).toBeDefined();
			expect(saveReportTool.description).toBeDefined();
			expect(saveReportTool.inputSchema).toBeDefined();
		});

		it("should register save-report tool with required input fields", async () => {
			const { saveReportTool } = await setupTestServerWithTools();

			expect(saveReportTool).toBeDefined();

			// Get the schema shape - Zod schemas have different structures
			const inputSchema = saveReportTool.inputSchema;
			expect(inputSchema).toBeDefined();

			// The schema should define taskId, reportType, content, fileType
			// We verify by checking the schema object structure
			if (inputSchema && typeof inputSchema === "object") {
				// Zod v4 schemas expose shape directly or via _def.shape()
				const shape =
					"shape" in inputSchema
						? inputSchema.shape
						: "_def" in inputSchema &&
							  inputSchema._def &&
							  typeof inputSchema._def === "object" &&
							  "shape" in inputSchema._def
							? typeof inputSchema._def.shape === "function"
								? inputSchema._def.shape()
								: inputSchema._def.shape
							: undefined;

				if (shape) {
					expect(shape).toHaveProperty("taskId");
					expect(shape).toHaveProperty("reportType");
					expect(shape).toHaveProperty("content");
					expect(shape).toHaveProperty("fileType");
				}
			}
		});
	});

	describe("save-report tool invocation", () => {
		it("should handle save-report tool call with valid input", async () => {
			const { saveReportTool } = await setupTestServerWithTools();

			expect(saveReportTool).toBeDefined();
			expect(saveReportTool.handler).toBeDefined();

			// Call the handler directly with valid input
			const result = await saveReportTool.handler!(
				{
					taskId: "test-task-123",
					reportType: "requirements",
					content: "# Test Report\nThis is test content.",
					fileType: "full",
				},
				{} // empty extra context
			);

			expect(result).toBeDefined();
			expect(result.content).toBeDefined();
			expect(result.content[0]).toHaveProperty("type", "text");

			// Parse the result text as JSON to verify success
			const resultData = JSON.parse(result.content[0].text);
			expect(resultData).toEqual({ success: true });
		});

		it("should handle save-report tool call with invalid input", async () => {
			const { saveReportTool } = await setupTestServerWithTools();

			expect(saveReportTool).toBeDefined();
			expect(saveReportTool.handler).toBeDefined();

			// Call with invalid input (empty taskId)
			const result = await saveReportTool.handler!(
				{
					taskId: "",
					reportType: "requirements",
					content: "content",
					fileType: "full",
				},
				{}
			);

			expect(result).toBeDefined();
			expect(result.content).toBeDefined();

			// Parse result - should have success: false with error
			const resultData = JSON.parse(result.content[0].text);
			expect(resultData.success).toBe(false);
			expect(resultData.error).toBeDefined();
		});

		it("should return proper MCP response format", async () => {
			const { saveReportTool } = await setupTestServerWithTools();

			const result = await saveReportTool.handler!(
				{
					taskId: "task-id",
					reportType: "plan",
					content: "content",
					fileType: "signal",
				},
				{}
			);

			// Verify MCP response format: { content: [{ type: "text", text: "..." }] }
			expect(result).toHaveProperty("content");
			expect(Array.isArray(result.content)).toBe(true);
			expect(result.content.length).toBeGreaterThan(0);
			expect(result.content[0]).toHaveProperty("type", "text");
			expect(typeof result.content[0].text).toBe("string");
		});
	});

	describe("tool integration with existing modules", () => {
		it("should use saveReport function from tools/save-report module", async () => {
			// This test verifies the integration between:
			// - The tool registration module
			// - The saveReport function
			// - The storage module

			const { saveReportTool } = await setupTestServerWithTools();

			// Save a report
			const saveResult = await saveReportTool.handler!(
				{
					taskId: "integration-test-123",
					reportType: "implementation",
					content: "Integration test content",
					fileType: "full",
				},
				{}
			);

			const parsedResult = JSON.parse(saveResult.content[0].text);
			expect(parsedResult.success).toBe(true);

			// Verify the report was stored by checking storage
			const { reportStorage } = await import("../storage/report-storage.js");
			const storedReport = reportStorage.get(
				"integration-test-123",
				"implementation",
				"full"
			);

			expect(storedReport).toBeDefined();
			expect(storedReport?.taskId).toBe("integration-test-123");
			expect(storedReport?.reportType).toBe("implementation");
			expect(storedReport?.content).toBe("Integration test content");
		});
	});
});
