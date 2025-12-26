import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	extractEnumValues,
	extractSchemaShape,
	setupTestServerWithTools,
} from "./helpers/mcp-test-utils";
import { REPORT_TYPES, ReportType } from "../types/report.type";
import { TOKENS } from "../container";
import { ReportRepository } from "../report/types/report.repository.interface";
import { SignalStatus } from "../signal/types/signal-status.type";

// Mock the wait-signal config to use short timeouts in tests
vi.mock("../config/wait-signal.config", () => ({
	waitSignalConfig: {
		timeoutMs: 150,
		pollIntervalMs: 100,
	},
}));

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
						reportType: ReportType.REQUIREMENTS,
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
						reportType: ReportType.REQUIREMENTS,
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
					reportType: ReportType.PLAN,
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
				// - The report-repository module

				const { saveReportTool, container } = await setupTestServerWithTools();

				// Save a report
				const saveResult = await saveReportTool.handler!(
					{
						taskId: "integration-test-123",
						reportType: ReportType.IMPLEMENTATION,
						content: "Integration test content",
					},
					{}
				);

				const parsedResult = JSON.parse(saveResult.content[0].text);
				expect(parsedResult.success).toBe(true);

				// Verify the report was stored by checking report-repository via container
				const reportRepository = container.get<ReportRepository>(
					TOKENS.ReportRepository
				);
				const storedReport = reportRepository.get(
					"integration-test-123",
					ReportType.IMPLEMENTATION
				);

				expect(storedReport).toBeDefined();
				expect(storedReport?.taskId).toBe("integration-test-123");
				expect(storedReport?.reportType).toBe(ReportType.IMPLEMENTATION);
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
						reportType: ReportType.REQUIREMENTS,
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
						reportType: ReportType.REQUIREMENTS,
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
						reportType: ReportType.PLAN,
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
						reportType: ReportType.ACCEPTANCE,
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
						reportType: ReportType.ACCEPTANCE,
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
				// - The report-repository module

				const { saveReportTool, getReportTool, container } =
					await setupTestServerWithTools();

				// Save a report first
				await saveReportTool.handler!(
					{
						taskId: "integration-module-test-789",
						reportType: ReportType.SECURITY,
						content: "Security integration test content",
					},
					{}
				);

				// Retrieve via MCP tool
				const getResult = await getReportTool.handler!(
					{
						taskId: "integration-module-test-789",
						reportType: ReportType.SECURITY,
					},
					{}
				);

				const parsedResult = JSON.parse(getResult.content[0].text);
				expect(parsedResult.success).toBe(true);
				expect(parsedResult.content).toBe("Security integration test content");

				// Verify consistency with direct report-repository access via container
				const reportRepository = container.get<ReportRepository>(
					TOKENS.ReportRepository
				);
				const storedReport = reportRepository.get(
					"integration-module-test-789",
					ReportType.SECURITY
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
					expect(enumValues).toHaveLength(REPORT_TYPES.length);
				}
			}
		);

		it.concurrent(
			"should include all valid reportType values in the schema",
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
					expect(enumValues).toHaveLength(REPORT_TYPES.length);
				}
			}
		);

		it.concurrent(
			"should include all valid reportType values in get-report schema",
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

	// ============================================================
	// save-signal Tool Registration
	// ============================================================
	describe("save-signal tool registration", () => {
		it.concurrent(
			"should register save-signal tool with the MCP server",
			async () => {
				const { registeredTools } = await setupTestServerWithTools();

				expect(registeredTools).toBeDefined();
				expect("save-signal" in registeredTools).toBe(true);
			}
		);

		it.concurrent(
			"should register save-signal tool with correct schema",
			async () => {
				const { saveSignalTool } = await setupTestServerWithTools();

				expect(saveSignalTool).toBeDefined();
				expect(saveSignalTool.description).toBeDefined();
				expect(saveSignalTool.inputSchema).toBeDefined();
			}
		);

		it.concurrent(
			"should register save-signal tool with required input fields (taskId, signalType, content)",
			async () => {
				const { saveSignalTool } = await setupTestServerWithTools();

				expect(saveSignalTool).toBeDefined();
				expect(saveSignalTool.inputSchema).toBeDefined();

				const shape = extractSchemaShape(saveSignalTool.inputSchema);
				if (shape) {
					expect(shape).toHaveProperty("taskId");
					expect(shape).toHaveProperty("signalType");
					expect(shape).toHaveProperty("content");
				}
			}
		);
	});

	// ============================================================
	// save-signal Tool Invocation
	// ============================================================
	describe("save-signal tool invocation", () => {
		it.concurrent(
			"should handle save-signal tool call with valid input",
			async () => {
				const { saveSignalTool } = await setupTestServerWithTools();

				expect(saveSignalTool).toBeDefined();
				expect(saveSignalTool.handler).toBeDefined();

				// Call the handler directly with valid input
				const result = await saveSignalTool.handler!(
					{
						taskId: "test-signal-task-123",
						signalType: ReportType.REQUIREMENTS,
						content: {
							status: SignalStatus.PASSED,
							summary: "All requirements validated successfully",
						},
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
			"should handle save-signal tool call with invalid input (empty taskId)",
			async () => {
				const { saveSignalTool } = await setupTestServerWithTools();

				expect(saveSignalTool).toBeDefined();
				expect(saveSignalTool.handler).toBeDefined();

				// Call with invalid input (empty taskId)
				const result = await saveSignalTool.handler!(
					{
						taskId: "",
						signalType: ReportType.REQUIREMENTS,
						content: {
							status: SignalStatus.PASSED,
							summary: "Summary",
						},
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
			"should return proper MCP response format for save-signal",
			async () => {
				const { saveSignalTool } = await setupTestServerWithTools();

				const result = await saveSignalTool.handler!(
					{
						taskId: "signal-task-id",
						signalType: ReportType.PLAN,
						content: {
							status: SignalStatus.FAILED,
							summary: "Plan review failed",
						},
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
	// wait-signal Tool Registration
	// ============================================================
	describe("wait-signal tool registration", () => {
		it.concurrent(
			"should register wait-signal tool with the MCP server",
			async () => {
				const { registeredTools } = await setupTestServerWithTools();

				expect(registeredTools).toBeDefined();
				expect("wait-signal" in registeredTools).toBe(true);
			}
		);

		it.concurrent(
			"should register wait-signal tool with correct schema",
			async () => {
				const { waitSignalTool } = await setupTestServerWithTools();

				expect(waitSignalTool).toBeDefined();
				expect(waitSignalTool.description).toBeDefined();
				expect(waitSignalTool.inputSchema).toBeDefined();
			}
		);

		it.concurrent(
			"should register wait-signal tool with required input fields (taskId, signalType)",
			async () => {
				const { waitSignalTool } = await setupTestServerWithTools();

				expect(waitSignalTool).toBeDefined();
				expect(waitSignalTool.inputSchema).toBeDefined();

				const shape = extractSchemaShape(waitSignalTool.inputSchema);
				if (shape) {
					expect(shape).toHaveProperty("taskId");
					expect(shape).toHaveProperty("signalType");
				}
			}
		);
	});

	// ============================================================
	// wait-signal Tool Invocation
	// ============================================================
	describe("wait-signal tool invocation", () => {
		it.concurrent(
			"should handle wait-signal tool call with timeout when signal is missing",
			async () => {
				const { waitSignalTool } = await setupTestServerWithTools();

				expect(waitSignalTool).toBeDefined();
				expect(waitSignalTool.handler).toBeDefined();

				// Call the handler with valid input - will timeout since no signal exists
				// Timeout is configured via server-side config (mocked to 150ms)
				const result = await waitSignalTool.handler!(
					{
						taskId: "test-wait-task-123",
						signalType: ReportType.REQUIREMENTS,
					},
					{} // empty extra context
				);

				expect(result).toBeDefined();
				expect(result.content).toBeDefined();
				expect(result.content[0]).toHaveProperty("type", "text");

				// Parse the result - should fail with timeout error
				const resultData = JSON.parse(result.content[0].text);
				expect(resultData.success).toBe(false);
				expect(resultData.error).toContain("Timeout");
			}
		);

		it.concurrent(
			"should handle wait-signal tool call with invalid input (empty taskId)",
			async () => {
				const { waitSignalTool } = await setupTestServerWithTools();

				expect(waitSignalTool).toBeDefined();
				expect(waitSignalTool.handler).toBeDefined();

				// Call with invalid input (empty taskId)
				const result = await waitSignalTool.handler!(
					{
						taskId: "",
						signalType: ReportType.REQUIREMENTS,
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
			"should return proper MCP response format for wait-signal",
			async () => {
				const { waitSignalTool } = await setupTestServerWithTools();

				const result = await waitSignalTool.handler!(
					{
						taskId: "wait-task-id",
						signalType: ReportType.PLAN,
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
	// wait-signal Integration with save-signal
	// ============================================================
	describe("wait-signal integration with save-signal", () => {
		it.concurrent(
			"should retrieve a previously saved signal via wait-signal tool",
			async () => {
				const { saveSignalTool, waitSignalTool, createMetadataTool } =
					await setupTestServerWithTools();

				// First, create metadata (required for waitSignal to work)
				await createMetadataTool.handler!(
					{
						taskId: "integration-signal-test-456",
						executionSteps: [ReportType.ACCEPTANCE],
					},
					{}
				);

				// Save a signal
				const saveResult = await saveSignalTool.handler!(
					{
						taskId: "integration-signal-test-456",
						signalType: ReportType.ACCEPTANCE,
						content: {
							status: SignalStatus.PASSED,
							summary: "Acceptance tests passed",
						},
					},
					{}
				);

				const parsedSaveResult = JSON.parse(saveResult.content[0].text);
				expect(parsedSaveResult.success).toBe(true);

				// Now retrieve it via wait-signal (pollIntervalMs min is 100)
				const waitResult = await waitSignalTool.handler!(
					{
						taskId: "integration-signal-test-456",
						signalType: ReportType.ACCEPTANCE,
						timeoutMs: 1000,
						pollIntervalMs: 100,
					},
					{}
				);

				const parsedWaitResult = JSON.parse(waitResult.content[0].text);
				expect(parsedWaitResult.success).toBe(true);
				// waitSignal returns content array, not signal
				expect(parsedWaitResult.content).toBeDefined();
				expect(parsedWaitResult.content[0].status).toBe(SignalStatus.PASSED);
				expect(parsedWaitResult.content[0].summary).toBe(
					"Acceptance tests passed"
				);
			}
		);
	});

	// ============================================================
	// create-metadata Tool Registration
	// ============================================================
	describe("create-metadata tool registration", () => {
		it.concurrent(
			"should register create-metadata tool with the MCP server",
			async () => {
				const { registeredTools } = await setupTestServerWithTools();

				expect(registeredTools).toBeDefined();
				expect("create-metadata" in registeredTools).toBe(true);
			}
		);

		it.concurrent(
			"should register create-metadata tool with correct schema",
			async () => {
				const { createMetadataTool } = await setupTestServerWithTools();

				expect(createMetadataTool).toBeDefined();
				expect(createMetadataTool.description).toBeDefined();
				expect(createMetadataTool.inputSchema).toBeDefined();
			}
		);

		it.concurrent(
			"should register create-metadata tool with required input fields (taskId, executionSteps)",
			async () => {
				const { createMetadataTool } = await setupTestServerWithTools();

				expect(createMetadataTool).toBeDefined();
				expect(createMetadataTool.inputSchema).toBeDefined();

				const shape = extractSchemaShape(createMetadataTool.inputSchema);
				if (shape) {
					expect(shape).toHaveProperty("taskId");
					expect(shape).toHaveProperty("executionSteps");
				}
			}
		);
	});

	// ============================================================
	// create-metadata Tool Invocation
	// ============================================================
	describe("create-metadata tool invocation", () => {
		it.concurrent(
			"should handle create-metadata tool call with valid input",
			async () => {
				const { createMetadataTool } = await setupTestServerWithTools();

				expect(createMetadataTool).toBeDefined();
				expect(createMetadataTool.handler).toBeDefined();

				// Call the handler directly with valid input
				const result = await createMetadataTool.handler!(
					{
						taskId: "test-metadata-task-123",
						executionSteps: [
							ReportType.REQUIREMENTS,
							ReportType.PLAN,
							ReportType.IMPLEMENTATION,
						],
					},
					{} // empty extra context
				);

				expect(result).toBeDefined();
				expect(result.content).toBeDefined();
				expect(result.content[0]).toHaveProperty("type", "text");

				// Parse the result text as JSON to verify success
				const resultData = JSON.parse(result.content[0].text);
				expect(resultData.success).toBe(true);
			}
		);

		it.concurrent(
			"should handle create-metadata tool call with invalid input (empty taskId)",
			async () => {
				const { createMetadataTool } = await setupTestServerWithTools();

				expect(createMetadataTool).toBeDefined();
				expect(createMetadataTool.handler).toBeDefined();

				// Call with invalid input (empty taskId)
				const result = await createMetadataTool.handler!(
					{
						taskId: "",
						executionSteps: [ReportType.REQUIREMENTS],
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
			"should return proper MCP response format for create-metadata",
			async () => {
				const { createMetadataTool } = await setupTestServerWithTools();

				const result = await createMetadataTool.handler!(
					{
						taskId: "metadata-task-id",
						executionSteps: [ReportType.PLAN, ReportType.IMPLEMENTATION],
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
	// get-next-step Tool Registration
	// ============================================================
	describe("get-next-step tool registration", () => {
		it.concurrent(
			"should register get-next-step tool with the MCP server",
			async () => {
				const { registeredTools } = await setupTestServerWithTools();

				expect(registeredTools).toBeDefined();
				expect("get-next-step" in registeredTools).toBe(true);
			}
		);

		it.concurrent(
			"should register get-next-step tool with correct schema",
			async () => {
				const { getNextStepTool } = await setupTestServerWithTools();

				expect(getNextStepTool).toBeDefined();
				expect(getNextStepTool.description).toBeDefined();
				expect(getNextStepTool.inputSchema).toBeDefined();
			}
		);

		it.concurrent(
			"should register get-next-step tool with required input field (taskId)",
			async () => {
				const { getNextStepTool } = await setupTestServerWithTools();

				expect(getNextStepTool).toBeDefined();
				expect(getNextStepTool.inputSchema).toBeDefined();

				const shape = extractSchemaShape(getNextStepTool.inputSchema);
				if (shape) {
					expect(shape).toHaveProperty("taskId");
					// get-next-step should NOT have executionSteps field (unlike create-metadata)
					expect(shape).not.toHaveProperty("executionSteps");
				}
			}
		);
	});

	// ============================================================
	// get-next-step Tool Invocation
	// ============================================================
	describe("get-next-step tool invocation", () => {
		it.concurrent(
			"should handle get-next-step tool call with valid input (non-existent metadata)",
			async () => {
				const { getNextStepTool } = await setupTestServerWithTools();

				expect(getNextStepTool).toBeDefined();
				expect(getNextStepTool.handler).toBeDefined();

				// Call the handler with valid input for non-existent metadata
				const result = await getNextStepTool.handler!(
					{
						taskId: "non-existent-metadata-task-123",
					},
					{} // empty extra context
				);

				expect(result).toBeDefined();
				expect(result.content).toBeDefined();
				expect(result.content[0]).toHaveProperty("type", "text");

				// Parse the result text as JSON - should fail since metadata does not exist
				const resultData = JSON.parse(result.content[0].text);
				expect(resultData.success).toBe(false);
				expect(resultData.error).toBeDefined();
			}
		);

		it.concurrent(
			"should handle get-next-step tool call with invalid input (empty taskId)",
			async () => {
				const { getNextStepTool } = await setupTestServerWithTools();

				expect(getNextStepTool).toBeDefined();
				expect(getNextStepTool.handler).toBeDefined();

				// Call with invalid input (empty taskId)
				const result = await getNextStepTool.handler!(
					{
						taskId: "",
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
			"should return proper MCP response format for get-next-step",
			async () => {
				const { getNextStepTool } = await setupTestServerWithTools();

				const result = await getNextStepTool.handler!(
					{
						taskId: "get-next-step-task-id",
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
	// get-next-step Integration with create-metadata
	// ============================================================
	describe("get-next-step integration with create-metadata", () => {
		it.concurrent(
			"should retrieve first step from previously created metadata via get-next-step tool",
			async () => {
				const { createMetadataTool, getNextStepTool } =
					await setupTestServerWithTools();

				// First, create metadata
				const createResult = await createMetadataTool.handler!(
					{
						taskId: "integration-metadata-test-456",
						executionSteps: [
							ReportType.REQUIREMENTS,
							ReportType.PLAN,
							ReportType.IMPLEMENTATION,
						],
					},
					{}
				);

				const parsedCreateResult = JSON.parse(createResult.content[0].text);
				expect(parsedCreateResult.success).toBe(true);

				// Now retrieve next step via get-next-step
				const getResult = await getNextStepTool.handler!(
					{
						taskId: "integration-metadata-test-456",
					},
					{}
				);

				const parsedGetResult = JSON.parse(getResult.content[0].text);
				expect(parsedGetResult.success).toBe(true);
				expect(parsedGetResult.step).toBe(ReportType.REQUIREMENTS);
			}
		);

		it.concurrent(
			"should return same step on consecutive calls (step only advances via waitSignal)",
			async () => {
				const { createMetadataTool, getNextStepTool } =
					await setupTestServerWithTools();

				// Create metadata with multiple steps
				await createMetadataTool.handler!(
					{
						taskId: "integration-step-same-test",
						executionSteps: [
							ReportType.REQUIREMENTS,
							ReportType.PLAN,
							ReportType.IMPLEMENTATION,
						],
					},
					{}
				);

				// First call - should return ReportType.REQUIREMENTS
				const firstResult = await getNextStepTool.handler!(
					{
						taskId: "integration-step-same-test",
					},
					{}
				);
				const parsedFirstResult = JSON.parse(firstResult.content[0].text);
				expect(parsedFirstResult.step).toBe(ReportType.REQUIREMENTS);
				expect(parsedFirstResult.stepNumber).toBe(1);
				expect(parsedFirstResult.totalSteps).toBe(3);

				// Second call - should still return ReportType.REQUIREMENTS (step doesn't advance without signals)
				const secondResult = await getNextStepTool.handler!(
					{
						taskId: "integration-step-same-test",
					},
					{}
				);
				const parsedSecondResult = JSON.parse(secondResult.content[0].text);
				expect(parsedSecondResult.step).toBe(ReportType.REQUIREMENTS);
				expect(parsedSecondResult.stepNumber).toBe(1);
			}
		);
	});
});
