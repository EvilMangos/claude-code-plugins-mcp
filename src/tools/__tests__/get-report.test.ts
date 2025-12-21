import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getReport } from "../get-report";
import { reportStorage } from "../../storage/report-storage";
import { ReportType } from "../../types/report-types";
import { GetReportInput } from "../schemas/get-report.schema";
import type { StoredReport } from "../../types/stored-report";

/**
 * Test-only type that allows any string for reportType to test validation.
 */
type TestGetReportInput = Omit<GetReportInput, "reportType"> & {
	reportType: string;
};

// Mock the storage module
vi.mock("../../storage/report-storage", () => ({
	reportStorage: {
		save: vi.fn(),
		get: vi.fn(),
		clear: vi.fn(),
	},
}));

describe("get-report tool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	// ============================================================
	// REQ-1: Validate taskId Input
	// ============================================================
	describe("REQ-1: Validate taskId Input", () => {
		it.concurrent("should return error when taskId is missing", async () => {
			const input = {
				reportType: "requirements",
			} as GetReportInput;

			const result = await getReport(input);

			expect(result).toEqual({
				success: false,
				error: expect.stringContaining("taskId"),
			});
		});

		it.concurrent(
			"should return error when taskId is empty string",
			async () => {
				const input: GetReportInput = {
					taskId: "",
					reportType: "requirements",
				};

				const result = await getReport(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("taskId"),
				});
			}
		);

		it.concurrent(
			"should return error when taskId is whitespace only",
			async () => {
				const input: GetReportInput = {
					taskId: "   ",
					reportType: "requirements",
				};

				const result = await getReport(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("taskId"),
				});
			}
		);

		it.concurrent(
			"should accept valid taskId and proceed to storage lookup",
			async () => {
				vi.mocked(reportStorage.get).mockReturnValueOnce(undefined);

				const input: GetReportInput = {
					taskId: "valid-task-id",
					reportType: "requirements",
				};

				const result = await getReport(input);

				// If taskId is valid, it should at least query storage (not return validation error)
				expect(result.success).toBe(true);
				expect(reportStorage.get).toHaveBeenCalled();
			}
		);
	});

	// ============================================================
	// REQ-2: Validate reportType Input
	// ============================================================
	describe("REQ-2: Validate reportType Input", () => {
		it.concurrent(
			"should return error when reportType is missing",
			async () => {
				const input = {
					taskId: "task-123",
				} as GetReportInput;

				const result = await getReport(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("reportType"),
				});
			}
		);

		it.concurrent(
			"should return error when reportType is empty string",
			async () => {
				const input: TestGetReportInput = {
					taskId: "task-123",
					reportType: "",
				};

				const result = await getReport(input as GetReportInput);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("reportType"),
				});
			}
		);

		it.concurrent(
			"should return error when reportType is not in REPORT_TYPES",
			async () => {
				const invalidTypes = [
					"invalid-type",
					"custom-report",
					"my-special-type",
					"123-numeric-prefix",
				];

				const results = await Promise.all(
					invalidTypes.map((reportType) =>
						getReport({
							taskId: "task-123",
							reportType,
						} as GetReportInput)
					)
				);

				results.forEach((result) => {
					expect(result.success).toBe(false);
					expect(result.error).toBeDefined();
					expect(result.error).toMatch(/reportType/i);
				});
			}
		);

		it.concurrent("should accept all 12 valid report types", async () => {
			vi.mocked(reportStorage.get).mockReturnValue(undefined);

			const validTypes: ReportType[] = [
				"requirements",
				"plan",
				"tests-design",
				"tests-review",
				"implementation",
				"stabilization",
				"acceptance",
				"performance",
				"security",
				"refactoring",
				"code-review",
				"documentation",
			];

			const inputs: GetReportInput[] = validTypes.map((reportType) => ({
				taskId: "task-123",
				reportType,
			}));

			const results = await Promise.all(inputs.map(getReport));

			results.forEach((result) => {
				// Success because validation passed (even if report not found)
				expect(result.success).toBe(true);
			});
		});

		it.concurrent(
			"should reject uppercase variants of valid types (case-sensitive)",
			async () => {
				const uppercaseVariants = [
					"REQUIREMENTS",
					"Requirements",
					"PLAN",
					"Plan",
					"IMPLEMENTATION",
					"Implementation",
				];

				const results = await Promise.all(
					uppercaseVariants.map((reportType) =>
						getReport({
							taskId: "task-123",
							reportType,
						} as GetReportInput)
					)
				);

				results.forEach((result) => {
					expect(result.success).toBe(false);
					expect(result.error).toBeDefined();
				});
			}
		);
	});

	// ============================================================
	// REQ-3: Retrieve Existing Report from Storage
	// ============================================================
	describe("REQ-3: Retrieve Existing Report from Storage", () => {
		it.concurrent(
			"should return success with content when report exists",
			async () => {
				const storedReport: StoredReport = {
					taskId: "develop-feature-auth-123",
					reportType: "requirements",
					content: "# Requirements Report\n\nThis is the content.",
					savedAt: "2025-01-15T10:30:00.000Z",
				};

				vi.mocked(reportStorage.get).mockReturnValueOnce(storedReport);

				const input: GetReportInput = {
					taskId: "develop-feature-auth-123",
					reportType: "requirements",
				};

				const result = await getReport(input);

				expect(result).toEqual({
					success: true,
					content: storedReport.content,
				});
			}
		);

		it.concurrent(
			"should return only content string from storage",
			async () => {
				const storedReport: StoredReport = {
					taskId: "task-id-1",
					reportType: "plan",
					content: "# Plan Content",
					savedAt: "2025-01-15T10:30:00.000Z",
				};

				vi.mocked(reportStorage.get).mockReturnValueOnce(storedReport);

				const input: GetReportInput = {
					taskId: "task-id-1",
					reportType: "plan",
				};

				const result = await getReport(input);

				expect(result.success).toBe(true);
				expect(result.content).toBe("# Plan Content");
			}
		);

		it.concurrent(
			"should call storage.get with correct taskId and reportType",
			async () => {
				vi.mocked(reportStorage.get).mockReturnValueOnce(undefined);

				const input: GetReportInput = {
					taskId: "my-task-id",
					reportType: "implementation",
				};

				await getReport(input);

				expect(reportStorage.get).toHaveBeenCalledWith(
					"my-task-id",
					"implementation"
				);
			}
		);
	});

	// ============================================================
	// REQ-4: Handle Non-Existent Report
	// ============================================================
	describe("REQ-4: Handle Non-Existent Report", () => {
		it.concurrent(
			"should return success true with content null when report not found",
			async () => {
				vi.mocked(reportStorage.get).mockReturnValueOnce(undefined);

				const input: GetReportInput = {
					taskId: "non-existent-task",
					reportType: "requirements",
				};

				const result = await getReport(input);

				expect(result).toEqual({
					success: true,
					content: null,
				});
			}
		);

		it.concurrent(
			"should not return error when report is not found",
			async () => {
				vi.mocked(reportStorage.get).mockReturnValueOnce(undefined);

				const input: GetReportInput = {
					taskId: "non-existent-task",
					reportType: "plan",
				};

				const result = await getReport(input);

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
			}
		);
	});

	// ============================================================
	// REQ-5: Handle Storage Errors Gracefully
	// ============================================================
	describe("REQ-5: Handle Storage Errors Gracefully", () => {
		it.concurrent("should handle storage exceptions gracefully", async () => {
			vi.mocked(reportStorage.get).mockImplementationOnce(() => {
				throw new Error("Storage failure");
			});

			const input: GetReportInput = {
				taskId: "task-123",
				reportType: "requirements",
			};

			const result = await getReport(input);

			expect(result).toEqual({
				success: false,
				error: expect.stringContaining("Storage failure"),
			});
		});

		it.concurrent(
			"should handle non-Error thrown objects gracefully",
			async () => {
				vi.mocked(reportStorage.get).mockImplementationOnce(() => {
					throw "String error"; // Non-Error thrown
				});

				const input: GetReportInput = {
					taskId: "task-123",
					reportType: "requirements",
				};

				const result = await getReport(input);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);

		it.concurrent(
			"should return error structure with success false and error message",
			async () => {
				vi.mocked(reportStorage.get).mockImplementationOnce(() => {
					throw new Error("Internal database error");
				});

				const input: GetReportInput = {
					taskId: "task-123",
					reportType: "requirements",
				};

				const result = await getReport(input);

				expect(result).toHaveProperty("success", false);
				expect(result).toHaveProperty("error");
				expect(typeof result.error).toBe("string");
			}
		);
	});

	// ============================================================
	// Edge Cases
	// ============================================================
	describe("Edge Cases", () => {
		it.concurrent("should handle concurrent get calls", async () => {
			const storedReports: StoredReport[] = [
				{
					taskId: "task-concurrent-1",
					reportType: "requirements",
					content: "c1",
					savedAt: "2025-01-15T10:30:00.000Z",
				},
				{
					taskId: "task-concurrent-2",
					reportType: "plan",
					content: "c2",
					savedAt: "2025-01-15T10:31:00.000Z",
				},
				{
					taskId: "task-concurrent-3",
					reportType: "implementation",
					content: "c3",
					savedAt: "2025-01-15T10:32:00.000Z",
				},
			];

			vi.mocked(reportStorage.get)
				.mockReturnValueOnce(storedReports[0])
				.mockReturnValueOnce(storedReports[1])
				.mockReturnValueOnce(storedReports[2]);

			const inputs: GetReportInput[] = [
				{ taskId: "task-concurrent-1", reportType: "requirements" },
				{ taskId: "task-concurrent-2", reportType: "plan" },
				{ taskId: "task-concurrent-3", reportType: "implementation" },
			];

			const results = await Promise.all(inputs.map(getReport));

			expect(results[0]).toEqual({ success: true, content: "c1" });
			expect(results[1]).toEqual({ success: true, content: "c2" });
			expect(results[2]).toEqual({ success: true, content: "c3" });
		});

		it.concurrent("should handle taskId with various formats", async () => {
			vi.mocked(reportStorage.get).mockReturnValue(undefined);

			const taskIds = [
				"develop-feature-auth-123",
				"fix-bug-login-1234567890",
				"simple",
				"with_underscores",
				"123-starting-with-numbers",
			];

			const inputs: GetReportInput[] = taskIds.map((taskId) => ({
				taskId,
				reportType: "requirements",
			}));

			const results = await Promise.all(inputs.map(getReport));

			results.forEach((result) => {
				expect(result.success).toBe(true);
			});
		});

		it.concurrent(
			"should return report with large content unchanged",
			async () => {
				const largeContent = "x".repeat(1000000); // 1MB of content
				const storedReport: StoredReport = {
					taskId: "task-large",
					reportType: "requirements",
					content: largeContent,
					savedAt: "2025-01-15T10:30:00.000Z",
				};

				vi.mocked(reportStorage.get).mockReturnValueOnce(storedReport);

				const input: GetReportInput = {
					taskId: "task-large",
					reportType: "requirements",
				};

				const result = await getReport(input);

				expect(result.success).toBe(true);
				expect(result.content).toBe(largeContent);
				expect(result.content?.length).toBe(1000000);
			}
		);

		it.concurrent(
			"should return content with special characters unchanged",
			async () => {
				const specialContent =
					"Content with unicode: \u0000\u0001\u0002 and emojis: \uD83D\uDE00\uD83D\uDE01";
				const storedReport: StoredReport = {
					taskId: "task-special",
					reportType: "requirements",
					content: specialContent,
					savedAt: "2025-01-15T10:30:00.000Z",
				};

				vi.mocked(reportStorage.get).mockReturnValueOnce(storedReport);

				const input: GetReportInput = {
					taskId: "task-special",
					reportType: "requirements",
				};

				const result = await getReport(input);

				expect(result.success).toBe(true);
				expect(result.content).toBe(specialContent);
			}
		);

		it.concurrent(
			"should return content with markdown formatting unchanged",
			async () => {
				const markdownContent = `
# Heading 1
## Heading 2

- List item 1
- List item 2

\`\`\`typescript
const code = "example";
\`\`\`

| Table | Header |
|-------|--------|
| Cell  | Cell   |
`;
				const storedReport: StoredReport = {
					taskId: "task-markdown",
					reportType: "documentation",
					content: markdownContent,
					savedAt: "2025-01-15T10:30:00.000Z",
				};

				vi.mocked(reportStorage.get).mockReturnValueOnce(storedReport);

				const input: GetReportInput = {
					taskId: "task-markdown",
					reportType: "documentation",
				};

				const result = await getReport(input);

				expect(result.success).toBe(true);
				expect(result.content).toBe(markdownContent);
			}
		);
	});

	// ============================================================
	// Multiple Validation Errors
	// ============================================================
	describe("Multiple Validation Errors", () => {
		it.concurrent(
			"should return error when multiple fields are invalid",
			async () => {
				const input = {} as GetReportInput;

				const result = await getReport(input);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);

		it.concurrent(
			"should return error when both taskId and reportType are invalid",
			async () => {
				const input: TestGetReportInput = {
					taskId: "",
					reportType: "invalid-type",
				};

				const result = await getReport(input as GetReportInput);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);
	});
});
