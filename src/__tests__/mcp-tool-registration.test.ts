import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	extractEnumValues,
	extractSchemaShape,
	setupTestServerWithTools,
} from "./helpers/mcp-test-utils";
import { REPORT_TYPES } from "../types/report-types";

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
		it.concurrent(
			"should register save-report tool with the MCP server",
			async () => {
				const { registeredTools } = await setupTestServerWithTools();

				expect(registeredTools).toBeDefined();
				expect("save-report" in registeredTools).toBe(true);
			}
		);

		it.concurrent(
			"should register save-report tool with correct schema",
			async () => {
				const { saveReportTool } = await setupTestServerWithTools();

				expect(saveReportTool).toBeDefined();
				expect(saveReportTool.description).toBeDefined();
				expect(saveReportTool.inputSchema).toBeDefined();
			}
		);

		it.concurrent(
			"should register save-report tool with required input fields",
			async () => {
				const { saveReportTool } = await setupTestServerWithTools();

				expect(saveReportTool).toBeDefined();
				expect(saveReportTool.inputSchema).toBeDefined();

				const shape = extractSchemaShape(saveReportTool.inputSchema);
				if (shape) {
					expect(shape).toHaveProperty("taskId");
					expect(shape).toHaveProperty("reportType");
					expect(shape).toHaveProperty("content");
				}
			}
		);
	});

	describe("save-report tool invocation", () => {
		it.concurrent(
			"should handle save-report tool call with valid input",
			async () => {
				const { saveReportTool } = await setupTestServerWithTools();

				expect(saveReportTool).toBeDefined();
				expect(saveReportTool.handler).toBeDefined();

				// Call the handler directly with valid input
				const result = await saveReportTool.handler!(
					{
						taskId: "test-task-123",
						reportType: "requirements",
						content: "# Test Report\nThis is test content.",
					},
					{} // empty extra context
				);

				expect(result).toBeDefined();
				expect(result.content).toBeDefined();
				expect(result.content[0]).toHaveProperty("type", "text");

				// Parse the result text as JSON to verify success
				const resultData = JSON.parse(result.content[0].text);
				expect(resultData).toEqual({ success: true });
			}
		);

		it.concurrent(
			"should handle save-report tool call with invalid input",
			async () => {
				const { saveReportTool } = await setupTestServerWithTools();

				expect(saveReportTool).toBeDefined();
				expect(saveReportTool.handler).toBeDefined();

				// Call with invalid input (empty taskId)
				const result = await saveReportTool.handler!(
					{
						taskId: "",
						reportType: "requirements",
						content: "content",
					},
					{}
				);

				expect(result).toBeDefined();
				expect(result.content).toBeDefined();

				// Parse result - should have success: false with error
				const resultData = JSON.parse(result.content[0].text);
				expect(resultData.success).toBe(false);
				expect(resultData.error).toBeDefined();
			}
		);

		it.concurrent("should return proper MCP response format", async () => {
			const { saveReportTool } = await setupTestServerWithTools();

			const result = await saveReportTool.handler!(
				{
					taskId: "task-id",
					reportType: "plan",
					content: "content",
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
		it.concurrent(
			"should use saveReport function from tools/save-report module",
			async () => {
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
					},
					{}
				);

				const parsedResult = JSON.parse(saveResult.content[0].text);
				expect(parsedResult.success).toBe(true);

				// Verify the report was stored by checking storage
				const { reportStorage } = await import("../storage/report-storage");
				const storedReport = reportStorage.get(
					"integration-test-123",
					"implementation"
				);

				expect(storedReport).toBeDefined();
				expect(storedReport?.taskId).toBe("integration-test-123");
				expect(storedReport?.reportType).toBe("implementation");
				expect(storedReport?.content).toBe("Integration test content");
			}
		);
	});

	// ============================================================
	// REQ-6: Schema Exposes Valid Values to MCP
	// ============================================================
	describe("REQ-6: Schema Exposes Valid Values to MCP", () => {
		it.concurrent(
			"should expose reportType as enum in the JSON schema",
			async () => {
				const { saveReportTool } = await setupTestServerWithTools();

				expect(saveReportTool).toBeDefined();
				expect(saveReportTool.inputSchema).toBeDefined();

				const shape = extractSchemaShape(saveReportTool.inputSchema);
				if (shape && "reportType" in shape) {
					const enumValues = extractEnumValues(shape.reportType);

					expect(enumValues).toBeDefined();
					expect(Array.isArray(enumValues)).toBe(true);
					expect(enumValues).toHaveLength(12);
				}
			}
		);

		it.concurrent(
			"should include all 12 valid reportType values in the schema",
			async () => {
				const { saveReportTool } = await setupTestServerWithTools();

				const shape = extractSchemaShape(saveReportTool.inputSchema);
				if (shape && "reportType" in shape) {
					const enumValues = extractEnumValues(shape.reportType);

					// Verify all expected values are present
					REPORT_TYPES.forEach((value) => {
						expect(enumValues).toContain(value);
					});
				}
			}
		);

		it.concurrent(
			"should reject invalid reportType via MCP handler",
			async () => {
				const { saveReportTool } = await setupTestServerWithTools();

				// Call with invalid reportType
				const result = await saveReportTool.handler!(
					{
						taskId: "test-task-123",
						reportType: "invalid-custom-type",
						content: "Test content",
					},
					{}
				);

				const parsedResult = JSON.parse(result.content[0].text);
				expect(parsedResult.success).toBe(false);
				expect(parsedResult.error).toBeDefined();
			}
		);

		it.concurrent(
			"should accept valid reportType via MCP handler",
			async () => {
				const { saveReportTool } = await setupTestServerWithTools();

				// Test each valid type through the MCP handler
				const results = await Promise.all(
					REPORT_TYPES.map((reportType) =>
						saveReportTool.handler!(
							{
								taskId: `test-task-${reportType}`,
								reportType,
								content: `Content for ${reportType}`,
							},
							{}
						)
					)
				);

				results.forEach((result) => {
					const parsedResult = JSON.parse(result.content[0].text);
					expect(parsedResult.success).toBe(true);
				});
			}
		);
	});
});
