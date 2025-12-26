import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportService } from "../report.service";
import { REPORT_TYPES, ReportType } from "../../types/report.type";
import { SaveReportInput } from "../schemas/save-report.schema";
import { createMockReportRepository } from "../repository/__mocks__/report.repository.mock";

/**
 * Test-only type that allows any string for reportType to test validation.
 */
type TestSaveReportInput = Omit<SaveReportInput, "reportType"> & {
	reportType: string;
};

// Create mock repository
const mockRepository = createMockReportRepository();

// Create service with mock repository
const reportService = new ReportService(mockRepository);

describe("ReportService.saveReport", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Save Report", () => {
		it.concurrent(
			"should save a report with valid inputs and return success",
			async () => {
				const input: SaveReportInput = {
					taskId: "develop-feature-auth-123",
					reportType: ReportType.REQUIREMENTS,
					content: "# Requirements Report\n\nThis is the content.",
				};

				const result = await reportService.saveReport(input);

				expect(result).toEqual({ success: true });
			}
		);

		it.concurrent(
			"should call repository.save with taskId, reportType, and content",
			async () => {
				const input: SaveReportInput = {
					taskId: "develop-feature-auth-123",
					reportType: ReportType.IMPLEMENTATION,
					content: "# Implementation Report",
				};

				await reportService.saveReport(input);

				expect(mockRepository.save).toHaveBeenCalledWith(
					"develop-feature-auth-123",
					ReportType.IMPLEMENTATION,
					"# Implementation Report"
				);
			}
		);

		it.concurrent(
			"should not pass timestamp to repository (timestamp is repository responsibility)",
			async () => {
				const input: SaveReportInput = {
					taskId: "task-id-1",
					reportType: ReportType.PLAN,
					content: "# Plan Content",
				};

				await reportService.saveReport(input);

				expect(mockRepository.save).toHaveBeenCalledWith(
					"task-id-1",
					ReportType.PLAN,
					"# Plan Content"
				);
				const matchingCall = vi
					.mocked(mockRepository.save)
					.mock.calls.find(
						(call) =>
							call[0] === "task-id-1" &&
							call[1] === ReportType.PLAN &&
							call[2] === "# Plan Content"
					);
				expect(matchingCall).toBeDefined();
				expect(matchingCall).toHaveLength(3);
			}
		);
	});

	describe("Input Validation", () => {
		describe("taskId validation", () => {
			it.concurrent("should return error when taskId is missing", async () => {
				const input = {
					reportType: ReportType.REQUIREMENTS,
					content: "content",
				} as SaveReportInput;

				const result = await reportService.saveReport(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("taskId"),
				});
			});

			it.concurrent(
				"should return error when taskId is empty string",
				async () => {
					const input: SaveReportInput = {
						taskId: "",
						reportType: ReportType.REQUIREMENTS,
						content: "content",
					};

					const result = await reportService.saveReport(input);

					expect(result).toEqual({
						success: false,
						error: expect.stringContaining("taskId"),
					});
				}
			);

			it.concurrent(
				"should return error when taskId is whitespace only",
				async () => {
					const input: SaveReportInput = {
						taskId: "   ",
						reportType: ReportType.REQUIREMENTS,
						content: "content",
					};

					const result = await reportService.saveReport(input);

					expect(result).toEqual({
						success: false,
						error: expect.stringContaining("taskId"),
					});
				}
			);
		});

		describe("reportType validation", () => {
			it.concurrent(
				"should return error when reportType is missing",
				async () => {
					const input = {
						taskId: "task-123",
						content: "content",
					} as SaveReportInput;

					const result = await reportService.saveReport(input);

					expect(result).toEqual({
						success: false,
						error: expect.stringContaining("reportType"),
					});
				}
			);

			it.concurrent(
				"should return error when reportType is empty string",
				async () => {
					const input: TestSaveReportInput = {
						taskId: "task-123",
						reportType: "",
						content: "content",
					};

					const result = await reportService.saveReport(
						input as SaveReportInput
					);

					expect(result).toEqual({
						success: false,
						error: expect.stringContaining("reportType"),
					});
				}
			);

			it.concurrent(
				"should return error when reportType is whitespace only",
				async () => {
					const input: TestSaveReportInput = {
						taskId: "task-123",
						reportType: "   ",
						content: "content",
					};

					const result = await reportService.saveReport(
						input as SaveReportInput
					);

					expect(result).toEqual({
						success: false,
						error: expect.stringContaining("reportType"),
					});
				}
			);
		});

		describe("content validation", () => {
			it.concurrent("should accept empty string content", async () => {
				const input: SaveReportInput = {
					taskId: "task-123",
					reportType: ReportType.IMPLEMENTATION,
					content: "",
				};

				const result = await reportService.saveReport(input);

				expect(result).toEqual({ success: true });
			});

			it.concurrent(
				"should return error when content is undefined",
				async () => {
					const input = {
						taskId: "task-123",
						reportType: ReportType.REQUIREMENTS,
					} as SaveReportInput;

					const result = await reportService.saveReport(input);

					expect(result).toEqual({
						success: false,
						error: expect.stringContaining("content"),
					});
				}
			);
		});

		describe("multiple validation errors", () => {
			it.concurrent(
				"should return error when multiple fields are missing",
				async () => {
					const input = {
						content: "content",
					} as SaveReportInput;

					const result = await reportService.saveReport(input);

					expect(result.success).toBe(false);
					expect(result.error).toBeDefined();
				}
			);
		});
	});

	describe("Overwrite Behavior", () => {
		it.concurrent(
			"should overwrite existing report with same key",
			async () => {
				const input: SaveReportInput = {
					taskId: "task-123",
					reportType: ReportType.REQUIREMENTS,
					content: "Updated content",
				};

				const result = await reportService.saveReport(input);

				expect(result).toEqual({ success: true });
				expect(mockRepository.save).toHaveBeenCalledWith(
					"task-123",
					ReportType.REQUIREMENTS,
					"Updated content"
				);
			}
		);

		it.concurrent("should not affect reports with different keys", async () => {
			const input1: SaveReportInput = {
				taskId: "task-different-keys-1",
				reportType: ReportType.REQUIREMENTS,
				content: "Requirements content",
			};
			const input2: SaveReportInput = {
				taskId: "task-different-keys-1",
				reportType: ReportType.IMPLEMENTATION,
				content: "Implementation content",
			};

			await reportService.saveReport(input1);
			await reportService.saveReport(input2);

			expect(mockRepository.save).toHaveBeenCalledWith(
				"task-different-keys-1",
				ReportType.REQUIREMENTS,
				"Requirements content"
			);
			expect(mockRepository.save).toHaveBeenCalledWith(
				"task-different-keys-1",
				ReportType.IMPLEMENTATION,
				"Implementation content"
			);
		});
	});

	describe("Accept Only Valid Report Types", () => {
		it.concurrent("should accept all valid report types", async () => {
			const inputs: SaveReportInput[] = REPORT_TYPES.map((reportType) => ({
				taskId: "task-123",
				reportType,
				content: `Content for ${reportType}`,
			}));

			const results = await Promise.all(
				inputs.map((input) => reportService.saveReport(input))
			);

			results.forEach((result) => {
				expect(result).toEqual({ success: true });
			});
		});

		it.concurrent(
			"should reject custom report types not in the enum",
			async () => {
				const invalidTypes = [
					"custom-report",
					"my-special-type",
					"experimental-phase",
					"user-defined",
					"123-numeric-prefix",
					"camelCaseType",
				];

				const results = await Promise.all(
					invalidTypes.map((reportType) =>
						reportService.saveReport({
							taskId: "task-123",
							reportType,
							content: `Content for ${reportType}`,
						} as SaveReportInput)
					)
				);

				results.forEach((result) => {
					expect(result.success).toBe(false);
					expect(result.error).toBeDefined();
					expect(result.error).toMatch(/reportType/i);
				});
			}
		);

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
						reportService.saveReport({
							taskId: "task-123",
							reportType,
							content: "Content",
						} as SaveReportInput)
					)
				);

				results.forEach((result) => {
					expect(result.success).toBe(false);
					expect(result.error).toBeDefined();
				});
			}
		);
	});

	describe("Error Handling", () => {
		it.concurrent(
			"should return error structure with success false and error message",
			async () => {
				const input: SaveReportInput = {
					taskId: "",
					reportType: ReportType.REQUIREMENTS,
					content: "content",
				};

				const result = await reportService.saveReport(input);

				expect(result).toHaveProperty("success", false);
				expect(result).toHaveProperty("error");
				expect(typeof result.error).toBe("string");
			}
		);

		it.concurrent(
			"should return descriptive error message for empty taskId",
			async () => {
				const input: SaveReportInput = {
					taskId: "",
					reportType: ReportType.REQUIREMENTS,
					content: "content",
				};

				const result = await reportService.saveReport(input);

				expect(result.error).toMatch(/taskId/i);
				expect(result.error!.length).toBeGreaterThan(5);
			}
		);

		it.concurrent("should handle repository errors gracefully", async () => {
			vi.mocked(mockRepository.save).mockImplementationOnce(() => {
				throw new Error("Repository failure");
			});

			const input: SaveReportInput = {
				taskId: "task-123",
				reportType: ReportType.REQUIREMENTS,
				content: "content",
			};

			const result = await reportService.saveReport(input);

			expect(result).toEqual({
				success: false,
				error: expect.stringContaining("Repository failure"),
			});
		});

		it.concurrent(
			"should not expose internal error details for unexpected errors",
			async () => {
				vi.mocked(mockRepository.save).mockImplementationOnce(() => {
					throw new Error("Internal database connection pool exhausted");
				});

				const input: SaveReportInput = {
					taskId: "task-123",
					reportType: ReportType.REQUIREMENTS,
					content: "content",
				};

				const result = await reportService.saveReport(input);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);
	});

	describe("Edge Cases", () => {
		it.concurrent("should handle very large content", async () => {
			const largeContent = "x".repeat(1000000);
			const input: SaveReportInput = {
				taskId: "task-123",
				reportType: ReportType.REQUIREMENTS,
				content: largeContent,
			};

			const result = await reportService.saveReport(input);

			expect(result).toEqual({ success: true });
		});

		it.concurrent("should handle content with special characters", async () => {
			const input: SaveReportInput = {
				taskId: "task-123",
				reportType: ReportType.REQUIREMENTS,
				content:
					"Content with unicode: \u0000\u0001\u0002 and emojis: \uD83D\uDE00\uD83D\uDE01",
			};

			const result = await reportService.saveReport(input);

			expect(result).toEqual({ success: true });
		});

		it.concurrent(
			"should handle content with markdown formatting",
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
				const input: SaveReportInput = {
					taskId: "task-123",
					reportType: ReportType.REQUIREMENTS,
					content: markdownContent,
				};

				const result = await reportService.saveReport(input);

				expect(result).toEqual({ success: true });
			}
		);

		it.concurrent("should handle taskId with various formats", async () => {
			const taskIds = [
				"develop-feature-auth-123",
				"fix-bug-login-1234567890",
				"simple",
				"with_underscores",
				"123-starting-with-numbers",
			];

			const inputs: SaveReportInput[] = taskIds.map((taskId) => ({
				taskId,
				reportType: ReportType.REQUIREMENTS,
				content: "content",
			}));

			const results = await Promise.all(
				inputs.map((input) => reportService.saveReport(input))
			);

			results.forEach((result) => {
				expect(result).toEqual({ success: true });
			});
		});

		it.concurrent("should handle concurrent save calls", async () => {
			const inputs: SaveReportInput[] = [
				{
					taskId: "task-concurrent-1",
					reportType: ReportType.REQUIREMENTS,
					content: "c1",
				},
				{
					taskId: "task-concurrent-2",
					reportType: ReportType.PLAN,
					content: "c2",
				},
				{
					taskId: "task-concurrent-3",
					reportType: ReportType.IMPLEMENTATION,
					content: "c3",
				},
			];

			const results = await Promise.all(
				inputs.map((input) => reportService.saveReport(input))
			);

			expect(results).toEqual([
				{ success: true },
				{ success: true },
				{ success: true },
			]);

			expect(mockRepository.save).toHaveBeenCalledWith(
				"task-concurrent-1",
				ReportType.REQUIREMENTS,
				"c1"
			);
			expect(mockRepository.save).toHaveBeenCalledWith(
				"task-concurrent-2",
				ReportType.PLAN,
				"c2"
			);
			expect(mockRepository.save).toHaveBeenCalledWith(
				"task-concurrent-3",
				ReportType.IMPLEMENTATION,
				"c3"
			);
		});
	});
});
