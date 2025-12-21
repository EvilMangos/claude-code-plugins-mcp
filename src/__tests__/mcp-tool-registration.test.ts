import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	extractEnumValues,
	extractSchemaShape,
	setupTestServerWithTools,
} from "./helpers/mcp-test-utils";
import { REPORT_TYPES } from "../types/report.type";

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
				const { reportStorage } = await import("../storage/report.storage");
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
	// get-report Tool Registration
	// ============================================================
	describe("get-report tool registration", () => {
		it.concurrent(
			"should register get-report tool with the MCP server",
			async () => {
				const { registeredTools } = await setupTestServerWithTools();

				expect(registeredTools).toBeDefined();
				expect("get-report" in registeredTools).toBe(true);
			}
		);

		it.concurrent(
			"should register get-report tool with correct schema",
			async () => {
				const { getReportTool } = await setupTestServerWithTools();

				expect(getReportTool).toBeDefined();
				expect(getReportTool.description).toBeDefined();
				expect(getReportTool.inputSchema).toBeDefined();
			}
		);

		it.concurrent(
			"should register get-report tool with required input fields (taskId, reportType)",
			async () => {
				const { getReportTool } = await setupTestServerWithTools();

				expect(getReportTool).toBeDefined();
				expect(getReportTool.inputSchema).toBeDefined();

				const shape = extractSchemaShape(getReportTool.inputSchema);
				if (shape) {
					expect(shape).toHaveProperty("taskId");
					expect(shape).toHaveProperty("reportType");
					// get-report should NOT have content field (unlike save-report)
					expect(shape).not.toHaveProperty("content");
				}
			}
		);
	});

	// ============================================================
	// get-report Tool Invocation
	// ============================================================
	describe("get-report tool invocation", () => {
		it.concurrent(
			"should handle get-report tool call with valid input (non-existent report)",
			async () => {
				const { getReportTool } = await setupTestServerWithTools();

				expect(getReportTool).toBeDefined();
				expect(getReportTool.handler).toBeDefined();

				// Call the handler with valid input for a non-existent report
				const result = await getReportTool.handler!(
					{
						taskId: "non-existent-task-123",
						reportType: "requirements",
					},
					{} // empty extra context
				);

				expect(result).toBeDefined();
				expect(result.content).toBeDefined();
				expect(result.content[0]).toHaveProperty("type", "text");

				// Parse the result text as JSON to verify success with null content
				const resultData = JSON.parse(result.content[0].text);
				expect(resultData.success).toBe(true);
				expect(resultData.content).toBeNull();
			}
		);

		it.concurrent(
			"should handle get-report tool call with invalid input",
			async () => {
				const { getReportTool } = await setupTestServerWithTools();

				expect(getReportTool).toBeDefined();
				expect(getReportTool.handler).toBeDefined();

				// Call with invalid input (empty taskId)
				const result = await getReportTool.handler!(
					{
						taskId: "",
						reportType: "requirements",
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

		it.concurrent(
			"should return proper MCP response format for get-report",
			async () => {
				const { getReportTool } = await setupTestServerWithTools();

				const result = await getReportTool.handler!(
					{
						taskId: "task-id",
						reportType: "plan",
					},
					{}
				);

				// Verify MCP response format: { content: [{ type: "text", text: "..." }] }
				expect(result).toHaveProperty("content");
				expect(Array.isArray(result.content)).toBe(true);
				expect(result.content.length).toBeGreaterThan(0);
				expect(result.content[0]).toHaveProperty("type", "text");
				expect(typeof result.content[0].text).toBe("string");
			}
		);
	});

	// ============================================================
	// get-report Integration with save-report
	// ============================================================
	describe("get-report integration with save-report", () => {
		it.concurrent(
			"should retrieve a previously saved report via get-report tool",
			async () => {
				const { saveReportTool, getReportTool } =
					await setupTestServerWithTools();

				// First, save a report
				const saveResult = await saveReportTool.handler!(
					{
						taskId: "integration-get-test-456",
						reportType: "acceptance",
						content: "# Acceptance Report\n\nThis is the acceptance content.",
					},
					{}
				);

				const parsedSaveResult = JSON.parse(saveResult.content[0].text);
				expect(parsedSaveResult.success).toBe(true);

				// Now retrieve it via get-report
				const getResult = await getReportTool.handler!(
					{
						taskId: "integration-get-test-456",
						reportType: "acceptance",
					},
					{}
				);

				const parsedGetResult = JSON.parse(getResult.content[0].text);
				expect(parsedGetResult.success).toBe(true);
				expect(parsedGetResult.content).toBe(
					"# Acceptance Report\n\nThis is the acceptance content."
				);
			}
		);

		it.concurrent(
			"should use getReport function from tools/get-report module",
			async () => {
				// This test verifies the integration between:
				// - The tool registration module
				// - The getReport function
				// - The storage module

				const { saveReportTool, getReportTool } =
					await setupTestServerWithTools();

				// Save a report first
				await saveReportTool.handler!(
					{
						taskId: "integration-module-test-789",
						reportType: "security",
						content: "Security integration test content",
					},
					{}
				);

				// Retrieve via MCP tool
				const getResult = await getReportTool.handler!(
					{
						taskId: "integration-module-test-789",
						reportType: "security",
					},
					{}
				);

				const parsedResult = JSON.parse(getResult.content[0].text);
				expect(parsedResult.success).toBe(true);
				expect(parsedResult.content).toBe("Security integration test content");

				// Verify consistency with direct storage access
				const { reportStorage } = await import("../storage/report.storage");
				const storedReport = reportStorage.get(
					"integration-module-test-789",
					"security"
				);

				expect(storedReport).toBeDefined();
				expect(storedReport?.content).toBe("Security integration test content");
			}
		);
	});

	describe("Schema Exposes Valid Values to MCP (save-report)", () => {
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

	describe("Schema Exposes Valid Values to MCP (get-report)", () => {
		it.concurrent(
			"should expose reportType as enum in get-report JSON schema",
			async () => {
				const { getReportTool } = await setupTestServerWithTools();

				expect(getReportTool).toBeDefined();
				expect(getReportTool.inputSchema).toBeDefined();

				const shape = extractSchemaShape(getReportTool.inputSchema);
				if (shape && "reportType" in shape) {
					const enumValues = extractEnumValues(shape.reportType);

					expect(enumValues).toBeDefined();
					expect(Array.isArray(enumValues)).toBe(true);
					expect(enumValues).toHaveLength(12);
				}
			}
		);

		it.concurrent(
			"should include all 12 valid reportType values in get-report schema",
			async () => {
				const { getReportTool } = await setupTestServerWithTools();

				const shape = extractSchemaShape(getReportTool.inputSchema);
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
			"should reject invalid reportType via get-report MCP handler",
			async () => {
				const { getReportTool } = await setupTestServerWithTools();

				// Call with invalid reportType
				const result = await getReportTool.handler!(
					{
						taskId: "test-task-123",
						reportType: "invalid-custom-type",
					},
					{}
				);

				const parsedResult = JSON.parse(result.content[0].text);
				expect(parsedResult.success).toBe(false);
				expect(parsedResult.error).toBeDefined();
			}
		);

		it.concurrent(
			"should accept valid reportType via get-report MCP handler",
			async () => {
				const { getReportTool } = await setupTestServerWithTools();

				// Test each valid type through the MCP handler
				const results = await Promise.all(
					REPORT_TYPES.map((reportType) =>
						getReportTool.handler!(
							{
								taskId: `get-test-task-${reportType}`,
								reportType,
							},
							{}
						)
					)
				);

				results.forEach((result) => {
					const parsedResult = JSON.parse(result.content[0].text);
					// Should succeed (with report: null since nothing is saved)
					expect(parsedResult.success).toBe(true);
				});
			}
		);
	});
});
