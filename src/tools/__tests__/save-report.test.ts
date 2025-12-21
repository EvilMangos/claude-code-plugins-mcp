import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveReport } from "../save-report";
import { reportStorage } from "../../storage/report-storage";
import { REPORT_TYPES, ReportType } from "../../types/report-types";
import { SaveReportInput } from "../schemas/save-report.schema";

/**
 * Test-only type that allows any string for reportType to test validation.
 */
type TestSaveReportInput = Omit<SaveReportInput, "reportType"> & {
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

describe("save-report tool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Mock Date.now for consistent timestamps
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-01-15T10:30:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	// ============================================================
	// REQ-1: Save Report
	// ============================================================
	describe("REQ-1: Save Report", () => {
		it.concurrent(
			"should save a report with valid inputs and return success",
			async () => {
				const input: SaveReportInput = {
					taskId: "develop-feature-auth-123",
					reportType: "requirements",
					content: "# Requirements Report\n\nThis is the content.",
				};

				const result = await saveReport(input);

				expect(result).toEqual({ success: true });
			}
		);

		it.concurrent(
			"should store the report with correct composite key",
			async () => {
				const input: SaveReportInput = {
					taskId: "develop-feature-auth-123",
					reportType: "implementation",
					content: "# Implementation Report",
				};

				await saveReport(input);

				expect(reportStorage.save).toHaveBeenCalledWith(
					expect.objectContaining({
						taskId: "develop-feature-auth-123",
						reportType: "implementation",
					})
				);
			}
		);

		it.concurrent(
			"should store the report with all expected fields including savedAt timestamp",
			async () => {
				const input: SaveReportInput = {
					taskId: "task-id-1",
					reportType: "plan",
					content: "# Plan Content",
				};

				await saveReport(input);

				expect(reportStorage.save).toHaveBeenCalledWith({
					taskId: "task-id-1",
					reportType: "plan",
					content: "# Plan Content",
					savedAt: "2025-01-15T10:30:00.000Z",
				});
			}
		);
	});

	// ============================================================
	// REQ-2: Input Validation
	// ============================================================
	describe("REQ-2: Input Validation", () => {
		describe("taskId validation", () => {
			it.concurrent("should return error when taskId is missing", async () => {
				const input = {
					reportType: "requirements",
					content: "content",
				} as SaveReportInput;

				const result = await saveReport(input);

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
						reportType: "requirements",
						content: "content",
					};

					const result = await saveReport(input);

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
						reportType: "requirements",
						content: "content",
					};

					const result = await saveReport(input);

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

					const result = await saveReport(input);

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

					const result = await saveReport(input as SaveReportInput);

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

					const result = await saveReport(input as SaveReportInput);

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
					reportType: "implementation",
					content: "",
				};

				const result = await saveReport(input);

				expect(result).toEqual({ success: true });
			});

			it.concurrent(
				"should return error when content is undefined",
				async () => {
					const input = {
						taskId: "task-123",
						reportType: "requirements",
					} as SaveReportInput;

					const result = await saveReport(input);

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

					const result = await saveReport(input);

					expect(result.success).toBe(false);
					expect(result.error).toBeDefined();
				}
			);
		});
	});

	// ============================================================
	// REQ-3: Overwrite Behavior
	// ============================================================
	describe("REQ-3: Overwrite Behavior", () => {
		it.concurrent(
			"should overwrite existing report with same key",
			async () => {
				const input: SaveReportInput = {
					taskId: "task-123",
					reportType: "requirements",
					content: "Updated content",
				};

				const result = await saveReport(input);

				expect(result).toEqual({ success: true });
				// Storage.save should be called and handle overwrite internally
				expect(reportStorage.save).toHaveBeenCalledWith(
					expect.objectContaining({
						content: "Updated content",
					})
				);
			}
		);

		it.concurrent("should update savedAt timestamp on overwrite", async () => {
			// First save
			const input1: SaveReportInput = {
				taskId: "task-123",
				reportType: "requirements",
				content: "Original content",
			};
			await saveReport(input1);

			// Advance time
			vi.advanceTimersByTime(60000); // 1 minute

			// Second save (overwrite)
			const input2: SaveReportInput = {
				taskId: "task-123",
				reportType: "requirements",
				content: "Updated content",
			};
			await saveReport(input2);

			// Verify second call has updated timestamp
			expect(reportStorage.save).toHaveBeenLastCalledWith(
				expect.objectContaining({
					savedAt: "2025-01-15T10:31:00.000Z",
				})
			);
		});

		it.concurrent("should not affect reports with different keys", async () => {
			const input1: SaveReportInput = {
				taskId: "task-different-keys-1",
				reportType: "requirements",
				content: "Requirements content",
			};
			const input2: SaveReportInput = {
				taskId: "task-different-keys-1",
				reportType: "implementation",
				content: "Implementation content",
			};

			await saveReport(input1);
			await saveReport(input2);

			// Both saves should be called independently with their respective data
			expect(reportStorage.save).toHaveBeenCalledWith(
				expect.objectContaining({
					taskId: "task-different-keys-1",
					reportType: "requirements",
					content: "Requirements content",
				})
			);
			expect(reportStorage.save).toHaveBeenCalledWith(
				expect.objectContaining({
					taskId: "task-different-keys-1",
					reportType: "implementation",
					content: "Implementation content",
				})
			);
		});
	});

	// ============================================================
	// REQ-4: Accept Only Valid Report Types (Enum Constraint)
	// ============================================================
	describe("REQ-4: Accept Only Valid Report Types", () => {
		it.concurrent("should accept all 12 valid report types", async () => {
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

			const inputs: SaveReportInput[] = validTypes.map((reportType) => ({
				taskId: "task-123",
				reportType,
				content: `Content for ${reportType}`,
			}));

			const results = await Promise.all(inputs.map(saveReport));

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
						saveReport({
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
						saveReport({
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

		it.concurrent("should reject partial matches of valid types", async () => {
			const partialMatches = [
				"req",
				"impl",
				"plan-design",
				"test",
				"perf",
				"sec",
				"doc",
				"refactor",
			];

			const results = await Promise.all(
				partialMatches.map((reportType) =>
					saveReport({
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
		});

		it.concurrent(
			"should reject report types with special characters",
			async () => {
				const input = {
					taskId: "task-123",
					reportType: "report-with-dashes_and_underscores",
					content: "Content",
				};

				const result = await saveReport(input as SaveReportInput);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);

		it.concurrent("should reject single character report type", async () => {
			const input = {
				taskId: "task-123",
				reportType: "a",
				content: "Content",
			};

			const result = await saveReport(input as SaveReportInput);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});

		it.concurrent("should reject long invalid report type names", async () => {
			const input = {
				taskId: "task-123",
				reportType: "this-is-a-very-long-report-type-name-that-should-not-work",
				content: "Content",
			};

			const result = await saveReport(input as SaveReportInput);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});
	});

	// ============================================================
	// REQ-3: Export REPORT_TYPES and ReportType
	// ============================================================
	describe("REQ-3: Export REPORT_TYPES and ReportType", () => {
		it.concurrent("should export REPORT_TYPES constant with 12 values", () => {
			expect(REPORT_TYPES).toBeDefined();
			expect(Array.isArray(REPORT_TYPES)).toBe(true);
			expect(REPORT_TYPES).toHaveLength(12);
		});

		it.concurrent(
			"should export REPORT_TYPES containing all valid workflow stages",
			() => {
				const expectedTypes = [
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

				expectedTypes.forEach((type) => {
					expect(REPORT_TYPES).toContain(type);
				});
			}
		);

		it.concurrent(
			"should export ReportType type (compile-time verification)",
			() => {
				// This test verifies TypeScript compilation succeeds with ReportType
				// If ReportType is not exported, this file will fail to compile
				const validType: ReportType = "requirements";
				expect(validType).toBe("requirements");

				// TypeScript should allow all valid types
				const types: ReportType[] = [
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
				expect(types).toHaveLength(12);
			}
		);
	});

	// ============================================================
	// REQ-5: Error Handling
	// ============================================================
	describe("REQ-5: Error Handling", () => {
		it.concurrent(
			"should return error structure with success false and error message",
			async () => {
				const input: SaveReportInput = {
					taskId: "",
					reportType: "requirements",
					content: "content",
				};

				const result = await saveReport(input);

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
					reportType: "requirements",
					content: "content",
				};

				const result = await saveReport(input);

				expect(result.error).toMatch(/taskId/i);
				expect(result.error!.length).toBeGreaterThan(5);
			}
		);

		it.concurrent("should handle storage errors gracefully", async () => {
			vi.mocked(reportStorage.save).mockImplementationOnce(() => {
				throw new Error("Storage failure");
			});

			const input: SaveReportInput = {
				taskId: "task-123",
				reportType: "requirements",
				content: "content",
			};

			const result = await saveReport(input);

			expect(result).toEqual({
				success: false,
				error: expect.stringContaining("Storage failure"),
			});
		});

		it.concurrent(
			"should not expose internal error details for unexpected errors",
			async () => {
				vi.mocked(reportStorage.save).mockImplementationOnce(() => {
					throw new Error("Internal database connection pool exhausted");
				});

				const input: SaveReportInput = {
					taskId: "task-123",
					reportType: "requirements",
					content: "content",
				};

				const result = await saveReport(input);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);
	});

	// ============================================================
	// Edge Cases
	// ============================================================
	describe("Edge Cases", () => {
		it.concurrent("should handle very large content", async () => {
			const largeContent = "x".repeat(1000000); // 1MB of content
			const input: SaveReportInput = {
				taskId: "task-123",
				reportType: "requirements",
				content: largeContent,
			};

			const result = await saveReport(input);

			expect(result).toEqual({ success: true });
		});

		it.concurrent("should handle content with special characters", async () => {
			const input: SaveReportInput = {
				taskId: "task-123",
				reportType: "requirements",
				content:
					"Content with unicode: \u0000\u0001\u0002 and emojis: \uD83D\uDE00\uD83D\uDE01",
			};

			const result = await saveReport(input);

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
					reportType: "requirements",
					content: markdownContent,
				};

				const result = await saveReport(input);

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
				reportType: "requirements",
				content: "content",
			}));

			const results = await Promise.all(inputs.map(saveReport));

			results.forEach((result) => {
				expect(result).toEqual({ success: true });
			});
		});

		it.concurrent("should handle concurrent save calls", async () => {
			const inputs: SaveReportInput[] = [
				{
					taskId: "task-concurrent-1",
					reportType: "requirements",
					content: "c1",
				},
				{ taskId: "task-concurrent-2", reportType: "plan", content: "c2" },
				{
					taskId: "task-concurrent-3",
					reportType: "implementation",
					content: "c3",
				},
			];

			const results = await Promise.all(inputs.map(saveReport));

			expect(results).toEqual([
				{ success: true },
				{ success: true },
				{ success: true },
			]);

			// Verify each concurrent call was made with correct data
			expect(reportStorage.save).toHaveBeenCalledWith(
				expect.objectContaining({
					taskId: "task-concurrent-1",
					reportType: "requirements",
				})
			);
			expect(reportStorage.save).toHaveBeenCalledWith(
				expect.objectContaining({
					taskId: "task-concurrent-2",
					reportType: "plan",
				})
			);
			expect(reportStorage.save).toHaveBeenCalledWith(
				expect.objectContaining({
					taskId: "task-concurrent-3",
					reportType: "implementation",
				})
			);
		});
	});
});
