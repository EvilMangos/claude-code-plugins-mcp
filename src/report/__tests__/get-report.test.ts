import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportService } from "../report.service";
import { REPORT_TYPES, ReportType } from "../../types/report.type";
import { GetReportInput } from "../schemas/get-report.schema";
import type { StoredReport } from "../types/stored-report.interface";
import { createMockReportRepository } from "../repository/__mocks__/report.repository.mock";

/**
 * Test-only type that allows any string for reportType to test validation.
 */
type TestGetReportInput = Omit<GetReportInput, "reportType"> & {
	reportType: string;
};

// Create mock repository
const mockRepository = createMockReportRepository();

// Create service with mock repository
const reportService = new ReportService(mockRepository);

describe("ReportService.getReport", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Validate taskId Input", () => {
		it.concurrent("should return error when taskId is missing", async () => {
			const input = {
				reportType: ReportType.REQUIREMENTS,
			} as GetReportInput;

			const result = await reportService.getReport(input);

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
					reportType: ReportType.REQUIREMENTS,
				};

				const result = await reportService.getReport(input);

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
					reportType: ReportType.REQUIREMENTS,
				};

				const result = await reportService.getReport(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("taskId"),
				});
			}
		);

		it.concurrent(
			"should accept valid taskId and proceed to repository lookup",
			async () => {
				vi.mocked(mockRepository.get).mockReturnValueOnce(undefined);

				const input: GetReportInput = {
					taskId: "valid-task-id",
					reportType: ReportType.REQUIREMENTS,
				};

				const result = await reportService.getReport(input);

				expect(result.success).toBe(true);
				expect(mockRepository.get).toHaveBeenCalled();
			}
		);
	});

	describe("Validate reportType Input", () => {
		it.concurrent(
			"should return error when reportType is missing",
			async () => {
				const input = {
					taskId: "task-123",
				} as GetReportInput;

				const result = await reportService.getReport(input);

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

				const result = await reportService.getReport(input as GetReportInput);

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
						reportService.getReport({
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

		it.concurrent("should accept all valid report types", async () => {
			vi.mocked(mockRepository.get).mockReturnValue(undefined);

			const inputs: GetReportInput[] = REPORT_TYPES.map((reportType) => ({
				taskId: "task-123",
				reportType,
			}));

			const results = await Promise.all(
				inputs.map((input) => reportService.getReport(input))
			);

			results.forEach((result) => {
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
						reportService.getReport({
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

	describe("Retrieve Existing Report from Repository", () => {
		it.concurrent(
			"should return success with content when report exists",
			async () => {
				const storedReport: StoredReport = {
					taskId: "develop-feature-auth-123",
					reportType: ReportType.REQUIREMENTS,
					content: "# Requirements Report\n\nThis is the content.",
					savedAt: "2025-01-15T10:30:00.000Z",
				};

				vi.mocked(mockRepository.get).mockReturnValueOnce(storedReport);

				const input: GetReportInput = {
					taskId: "develop-feature-auth-123",
					reportType: ReportType.REQUIREMENTS,
				};

				const result = await reportService.getReport(input);

				expect(result).toEqual({
					success: true,
					content: storedReport.content,
				});
			}
		);

		it.concurrent(
			"should return only content string from repository",
			async () => {
				const storedReport: StoredReport = {
					taskId: "task-id-1",
					reportType: ReportType.PLAN,
					content: "# Plan Content",
					savedAt: "2025-01-15T10:30:00.000Z",
				};

				vi.mocked(mockRepository.get).mockReturnValueOnce(storedReport);

				const input: GetReportInput = {
					taskId: "task-id-1",
					reportType: ReportType.PLAN,
				};

				const result = await reportService.getReport(input);

				expect(result.success).toBe(true);
				expect(result.content).toBe("# Plan Content");
			}
		);

		it.concurrent(
			"should call repository.get with correct taskId and reportType",
			async () => {
				vi.mocked(mockRepository.get).mockReturnValueOnce(undefined);

				const input: GetReportInput = {
					taskId: "my-task-id",
					reportType: ReportType.IMPLEMENTATION,
				};

				await reportService.getReport(input);

				expect(mockRepository.get).toHaveBeenCalledWith(
					"my-task-id",
					ReportType.IMPLEMENTATION
				);
			}
		);
	});

	describe("Handle Non-Existent Report", () => {
		it.concurrent(
			"should return success true with content null when report not found",
			async () => {
				vi.mocked(mockRepository.get).mockReturnValueOnce(undefined);

				const input: GetReportInput = {
					taskId: "non-existent-task",
					reportType: ReportType.REQUIREMENTS,
				};

				const result = await reportService.getReport(input);

				expect(result).toEqual({
					success: true,
					content: null,
				});
			}
		);

		it.concurrent(
			"should not return error when report is not found",
			async () => {
				vi.mocked(mockRepository.get).mockReturnValueOnce(undefined);

				const input: GetReportInput = {
					taskId: "non-existent-task",
					reportType: ReportType.PLAN,
				};

				const result = await reportService.getReport(input);

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
			}
		);
	});

	describe("Handle Repository Errors Gracefully", () => {
		it.concurrent(
			"should handle repository exceptions gracefully",
			async () => {
				vi.mocked(mockRepository.get).mockImplementationOnce(() => {
					throw new Error("Repository failure");
				});

				const input: GetReportInput = {
					taskId: "task-123",
					reportType: ReportType.REQUIREMENTS,
				};

				const result = await reportService.getReport(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("Repository failure"),
				});
			}
		);

		it.concurrent(
			"should handle non-Error thrown objects gracefully",
			async () => {
				vi.mocked(mockRepository.get).mockImplementationOnce(() => {
					throw "String error";
				});

				const input: GetReportInput = {
					taskId: "task-123",
					reportType: ReportType.REQUIREMENTS,
				};

				const result = await reportService.getReport(input);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);

		it.concurrent(
			"should return error structure with success false and error message",
			async () => {
				vi.mocked(mockRepository.get).mockImplementationOnce(() => {
					throw new Error("Internal database error");
				});

				const input: GetReportInput = {
					taskId: "task-123",
					reportType: ReportType.REQUIREMENTS,
				};

				const result = await reportService.getReport(input);

				expect(result).toHaveProperty("success", false);
				expect(result).toHaveProperty("error");
				expect(typeof result.error).toBe("string");
			}
		);
	});

	describe("Edge Cases", () => {
		it.concurrent("should handle concurrent get calls", async () => {
			const storedReports: StoredReport[] = [
				{
					taskId: "task-concurrent-1",
					reportType: ReportType.REQUIREMENTS,
					content: "c1",
					savedAt: "2025-01-15T10:30:00.000Z",
				},
				{
					taskId: "task-concurrent-2",
					reportType: ReportType.PLAN,
					content: "c2",
					savedAt: "2025-01-15T10:31:00.000Z",
				},
				{
					taskId: "task-concurrent-3",
					reportType: ReportType.IMPLEMENTATION,
					content: "c3",
					savedAt: "2025-01-15T10:32:00.000Z",
				},
			];

			vi.mocked(mockRepository.get)
				.mockReturnValueOnce(storedReports[0])
				.mockReturnValueOnce(storedReports[1])
				.mockReturnValueOnce(storedReports[2]);

			const inputs: GetReportInput[] = [
				{ taskId: "task-concurrent-1", reportType: ReportType.REQUIREMENTS },
				{ taskId: "task-concurrent-2", reportType: ReportType.PLAN },
				{ taskId: "task-concurrent-3", reportType: ReportType.IMPLEMENTATION },
			];

			const results = await Promise.all(
				inputs.map((input) => reportService.getReport(input))
			);

			expect(results[0]).toEqual({ success: true, content: "c1" });
			expect(results[1]).toEqual({ success: true, content: "c2" });
			expect(results[2]).toEqual({ success: true, content: "c3" });
		});

		it.concurrent("should handle taskId with various formats", async () => {
			vi.mocked(mockRepository.get).mockReturnValue(undefined);

			const taskIds = [
				"develop-feature-auth-123",
				"fix-bug-login-1234567890",
				"simple",
				"with_underscores",
				"123-starting-with-numbers",
			];

			const inputs: GetReportInput[] = taskIds.map((taskId) => ({
				taskId,
				reportType: ReportType.REQUIREMENTS,
			}));

			const results = await Promise.all(
				inputs.map((input) => reportService.getReport(input))
			);

			results.forEach((result) => {
				expect(result.success).toBe(true);
			});
		});

		it.concurrent(
			"should return report with large content unchanged",
			async () => {
				const largeContent = "x".repeat(1000000);
				const storedReport: StoredReport = {
					taskId: "task-large",
					reportType: ReportType.REQUIREMENTS,
					content: largeContent,
					savedAt: "2025-01-15T10:30:00.000Z",
				};

				vi.mocked(mockRepository.get).mockReturnValueOnce(storedReport);

				const input: GetReportInput = {
					taskId: "task-large",
					reportType: ReportType.REQUIREMENTS,
				};

				const result = await reportService.getReport(input);

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
					reportType: ReportType.REQUIREMENTS,
					content: specialContent,
					savedAt: "2025-01-15T10:30:00.000Z",
				};

				vi.mocked(mockRepository.get).mockReturnValueOnce(storedReport);

				const input: GetReportInput = {
					taskId: "task-special",
					reportType: ReportType.REQUIREMENTS,
				};

				const result = await reportService.getReport(input);

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
					reportType: ReportType.DOCUMENTATION,
					content: markdownContent,
					savedAt: "2025-01-15T10:30:00.000Z",
				};

				vi.mocked(mockRepository.get).mockReturnValueOnce(storedReport);

				const input: GetReportInput = {
					taskId: "task-markdown",
					reportType: ReportType.DOCUMENTATION,
				};

				const result = await reportService.getReport(input);

				expect(result.success).toBe(true);
				expect(result.content).toBe(markdownContent);
			}
		);
	});

	describe("Multiple Validation Errors", () => {
		it.concurrent(
			"should return error when multiple fields are invalid",
			async () => {
				const input = {} as GetReportInput;

				const result = await reportService.getReport(input);

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

				const result = await reportService.getReport(input as GetReportInput);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);
	});
});
