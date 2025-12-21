import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveReport } from "../save-report";
import { reportStorage } from "../../storage/report-storage";
import { SaveReportInput } from "../schemas/save-report.schema";

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
	// REQ-1: Save Full Report
	// ============================================================
	describe("REQ-1: Save Full Report", () => {
		it("should save a report with valid inputs and return success", async () => {
			const input: SaveReportInput = {
				taskId: "develop-feature-auth-123",
				reportType: "requirements",
				content: "# Requirements Report\n\nThis is the content.",
				fileType: "full",
			};

			const result = await saveReport(input);

			expect(result).toEqual({ success: true });
		});

		it("should store the report with correct composite key", async () => {
			const input: SaveReportInput = {
				taskId: "develop-feature-auth-123",
				reportType: "implementation",
				content: "# Implementation Report",
				fileType: "full",
			};

			await saveReport(input);

			expect(reportStorage.save).toHaveBeenCalledWith(
				expect.objectContaining({
					taskId: "develop-feature-auth-123",
					reportType: "implementation",
					fileType: "full",
				})
			);
		});

		it("should store the report with all expected fields including savedAt timestamp", async () => {
			const input: SaveReportInput = {
				taskId: "task-id-1",
				reportType: "plan",
				content: "# Plan Content",
				fileType: "full",
			};

			await saveReport(input);

			expect(reportStorage.save).toHaveBeenCalledWith({
				taskId: "task-id-1",
				reportType: "plan",
				fileType: "full",
				content: "# Plan Content",
				savedAt: "2025-01-15T10:30:00.000Z",
			});
		});

		it("should handle signal file type", async () => {
			const input: SaveReportInput = {
				taskId: "task-123",
				reportType: "requirements",
				content: "STATUS: DONE\nFILE: requirements.md",
				fileType: "signal",
			};

			const result = await saveReport(input);

			expect(result).toEqual({ success: true });
			expect(reportStorage.save).toHaveBeenCalledWith(
				expect.objectContaining({
					fileType: "signal",
				})
			);
		});

		it("should handle logs file type", async () => {
			const input: SaveReportInput = {
				taskId: "task-123",
				reportType: "implementation",
				content: "[2025-01-15] Starting implementation...",
				fileType: "logs",
			};

			const result = await saveReport(input);

			expect(result).toEqual({ success: true });
			expect(reportStorage.save).toHaveBeenCalledWith(
				expect.objectContaining({
					fileType: "logs",
				})
			);
		});
	});

	// ============================================================
	// REQ-2: Input Validation
	// ============================================================
	describe("REQ-2: Input Validation", () => {
		describe("taskId validation", () => {
			it("should return error when taskId is missing", async () => {
				const input = {
					reportType: "requirements",
					content: "content",
					fileType: "full",
				} as SaveReportInput;

				const result = await saveReport(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("taskId"),
				});
			});

			it("should return error when taskId is empty string", async () => {
				const input: SaveReportInput = {
					taskId: "",
					reportType: "requirements",
					content: "content",
					fileType: "full",
				};

				const result = await saveReport(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("taskId"),
				});
			});

			it("should return error when taskId is whitespace only", async () => {
				const input: SaveReportInput = {
					taskId: "   ",
					reportType: "requirements",
					content: "content",
					fileType: "full",
				};

				const result = await saveReport(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("taskId"),
				});
			});
		});

		describe("reportType validation", () => {
			it("should return error when reportType is missing", async () => {
				const input = {
					taskId: "task-123",
					content: "content",
					fileType: "full",
				} as SaveReportInput;

				const result = await saveReport(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("reportType"),
				});
			});

			it("should return error when reportType is empty string", async () => {
				const input: SaveReportInput = {
					taskId: "task-123",
					reportType: "",
					content: "content",
					fileType: "full",
				};

				const result = await saveReport(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("reportType"),
				});
			});

			it("should return error when reportType is whitespace only", async () => {
				const input: SaveReportInput = {
					taskId: "task-123",
					reportType: "   ",
					content: "content",
					fileType: "full",
				};

				const result = await saveReport(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("reportType"),
				});
			});
		});

		describe("fileType validation", () => {
			it("should return error when fileType is missing", async () => {
				const input = {
					taskId: "task-123",
					reportType: "requirements",
					content: "content",
				} as SaveReportInput;

				const result = await saveReport(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("fileType"),
				});
			});

			it("should return error when fileType is invalid value", async () => {
				const input = {
					taskId: "task-123",
					reportType: "requirements",
					content: "content",
					fileType: "invalid" as "full",
				};

				const result = await saveReport(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("fileType"),
				});
			});

			it("should return error when fileType is empty string", async () => {
				const input = {
					taskId: "task-123",
					reportType: "requirements",
					content: "content",
					fileType: "" as "full",
				};

				const result = await saveReport(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("fileType"),
				});
			});
		});

		describe("content validation", () => {
			it("should accept empty string content for logs fileType", async () => {
				const input: SaveReportInput = {
					taskId: "task-123",
					reportType: "implementation",
					content: "",
					fileType: "logs",
				};

				const result = await saveReport(input);

				expect(result).toEqual({ success: true });
			});

			it("should accept empty string content for full fileType", async () => {
				const input: SaveReportInput = {
					taskId: "task-123",
					reportType: "implementation",
					content: "",
					fileType: "full",
				};

				const result = await saveReport(input);

				expect(result).toEqual({ success: true });
			});

			it("should return error when content is undefined", async () => {
				const input = {
					taskId: "task-123",
					reportType: "requirements",
					fileType: "full",
				} as SaveReportInput;

				const result = await saveReport(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("content"),
				});
			});
		});

		describe("multiple validation errors", () => {
			it("should return error when multiple fields are missing", async () => {
				const input = {
					content: "content",
				} as SaveReportInput;

				const result = await saveReport(input);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});
		});
	});

	// ============================================================
	// REQ-3: Overwrite Behavior
	// ============================================================
	describe("REQ-3: Overwrite Behavior", () => {
		it("should overwrite existing report with same key", async () => {
			const input: SaveReportInput = {
				taskId: "task-123",
				reportType: "requirements",
				content: "Updated content",
				fileType: "full",
			};

			const result = await saveReport(input);

			expect(result).toEqual({ success: true });
			// Storage.save should be called and handle overwrite internally
			expect(reportStorage.save).toHaveBeenCalledWith(
				expect.objectContaining({
					content: "Updated content",
				})
			);
		});

		it("should update savedAt timestamp on overwrite", async () => {
			// First save
			const input1: SaveReportInput = {
				taskId: "task-123",
				reportType: "requirements",
				content: "Original content",
				fileType: "full",
			};
			await saveReport(input1);

			// Advance time
			vi.advanceTimersByTime(60000); // 1 minute

			// Second save (overwrite)
			const input2: SaveReportInput = {
				taskId: "task-123",
				reportType: "requirements",
				content: "Updated content",
				fileType: "full",
			};
			await saveReport(input2);

			// Verify second call has updated timestamp
			expect(reportStorage.save).toHaveBeenLastCalledWith(
				expect.objectContaining({
					savedAt: "2025-01-15T10:31:00.000Z",
				})
			);
		});

		it("should not affect reports with different keys", async () => {
			const input1: SaveReportInput = {
				taskId: "task-123",
				reportType: "requirements",
				content: "Requirements content",
				fileType: "full",
			};
			const input2: SaveReportInput = {
				taskId: "task-123",
				reportType: "implementation",
				content: "Implementation content",
				fileType: "full",
			};

			await saveReport(input1);
			await saveReport(input2);

			// Both saves should be called independently
			expect(reportStorage.save).toHaveBeenCalledTimes(2);
		});

		it("should differentiate by fileType in the key", async () => {
			const inputFull: SaveReportInput = {
				taskId: "task-123",
				reportType: "requirements",
				content: "Full report content",
				fileType: "full",
			};
			const inputSignal: SaveReportInput = {
				taskId: "task-123",
				reportType: "requirements",
				content: "Signal content",
				fileType: "signal",
			};

			await saveReport(inputFull);
			await saveReport(inputSignal);

			// Both should be saved as different keys
			expect(reportStorage.save).toHaveBeenCalledWith(
				expect.objectContaining({ fileType: "full" })
			);
			expect(reportStorage.save).toHaveBeenCalledWith(
				expect.objectContaining({ fileType: "signal" })
			);
		});
	});

	// ============================================================
	// REQ-4: Accept Any Report Type
	// ============================================================
	describe("REQ-4: Accept Any Report Type", () => {
		it("should accept standard report types", async () => {
			const standardTypes = [
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

			const inputs = standardTypes.map((reportType) => ({
				taskId: "task-123",
				reportType,
				content: `Content for ${reportType}`,
				fileType: "full" as const,
			}));

			const results = await Promise.all(inputs.map(saveReport));

			results.forEach((result) => {
				expect(result).toEqual({ success: true });
			});
		});

		it("should accept custom report types", async () => {
			const customTypes = [
				"custom-report",
				"my-special-type",
				"experimental-phase",
				"user-defined",
				"123-numeric-prefix",
				"camelCaseType",
				"UPPERCASE_TYPE",
			];

			const inputs = customTypes.map((reportType) => ({
				taskId: "task-123",
				reportType,
				content: `Content for ${reportType}`,
				fileType: "full" as const,
			}));

			const results = await Promise.all(inputs.map(saveReport));

			results.forEach((result) => {
				expect(result).toEqual({ success: true });
			});
		});

		it("should accept report types with special characters", async () => {
			const input: SaveReportInput = {
				taskId: "task-123",
				reportType: "report-with-dashes_and_underscores",
				content: "Content",
				fileType: "full",
			};

			const result = await saveReport(input);

			expect(result).toEqual({ success: true });
		});

		it("should accept single character report type", async () => {
			const input: SaveReportInput = {
				taskId: "task-123",
				reportType: "a",
				content: "Content",
				fileType: "full",
			};

			const result = await saveReport(input);

			expect(result).toEqual({ success: true });
		});

		it("should accept long report type names", async () => {
			const input: SaveReportInput = {
				taskId: "task-123",
				reportType:
					"this-is-a-very-long-report-type-name-that-should-still-work",
				content: "Content",
				fileType: "full",
			};

			const result = await saveReport(input);

			expect(result).toEqual({ success: true });
		});
	});

	// ============================================================
	// REQ-5: Error Handling
	// ============================================================
	describe("REQ-5: Error Handling", () => {
		it("should return error structure with success false and error message", async () => {
			const input: SaveReportInput = {
				taskId: "",
				reportType: "requirements",
				content: "content",
				fileType: "full",
			};

			const result = await saveReport(input);

			expect(result).toHaveProperty("success", false);
			expect(result).toHaveProperty("error");
			expect(typeof result.error).toBe("string");
		});

		it("should return descriptive error message for empty taskId", async () => {
			const input: SaveReportInput = {
				taskId: "",
				reportType: "requirements",
				content: "content",
				fileType: "full",
			};

			const result = await saveReport(input);

			expect(result.error).toMatch(/taskId/i);
			expect(result.error!.length).toBeGreaterThan(5);
		});

		it("should return descriptive error message for invalid fileType", async () => {
			const input = {
				taskId: "task-123",
				reportType: "requirements",
				content: "content",
				fileType: "not-a-valid-type" as "full",
			} as SaveReportInput;

			const result = await saveReport(input);

			expect(result.error).toMatch(/fileType/i);
		});

		it("should handle storage errors gracefully", async () => {
			vi.mocked(reportStorage.save).mockImplementationOnce(() => {
				throw new Error("Storage failure");
			});

			const input: SaveReportInput = {
				taskId: "task-123",
				reportType: "requirements",
				content: "content",
				fileType: "full",
			};

			const result = await saveReport(input);

			expect(result).toEqual({
				success: false,
				error: expect.stringContaining("Storage failure"),
			});
		});

		it("should not expose internal error details for unexpected errors", async () => {
			vi.mocked(reportStorage.save).mockImplementationOnce(() => {
				throw new Error("Internal database connection pool exhausted");
			});

			const input: SaveReportInput = {
				taskId: "task-123",
				reportType: "requirements",
				content: "content",
				fileType: "full",
			};

			const result = await saveReport(input);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});
	});

	// ============================================================
	// Edge Cases
	// ============================================================
	describe("Edge Cases", () => {
		it("should handle very large content", async () => {
			const largeContent = "x".repeat(1000000); // 1MB of content
			const input: SaveReportInput = {
				taskId: "task-123",
				reportType: "requirements",
				content: largeContent,
				fileType: "full",
			};

			const result = await saveReport(input);

			expect(result).toEqual({ success: true });
		});

		it("should handle content with special characters", async () => {
			const input: SaveReportInput = {
				taskId: "task-123",
				reportType: "requirements",
				content:
					"Content with unicode: \u0000\u0001\u0002 and emojis: \uD83D\uDE00\uD83D\uDE01",
				fileType: "full",
			};

			const result = await saveReport(input);

			expect(result).toEqual({ success: true });
		});

		it("should handle content with markdown formatting", async () => {
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
				fileType: "full",
			};

			const result = await saveReport(input);

			expect(result).toEqual({ success: true });
		});

		it("should handle taskId with various formats", async () => {
			const taskIds = [
				"develop-feature-auth-123",
				"fix-bug-login-1234567890",
				"simple",
				"with_underscores",
				"123-starting-with-numbers",
			];

			const inputs = taskIds.map((taskId) => ({
				taskId,
				reportType: "requirements",
				content: "content",
				fileType: "full" as const,
			}));

			const results = await Promise.all(inputs.map(saveReport));

			results.forEach((result) => {
				expect(result).toEqual({ success: true });
			});
		});

		it("should handle concurrent save calls", async () => {
			const inputs: SaveReportInput[] = [
				{ taskId: "task-1", reportType: "r1", content: "c1", fileType: "full" },
				{ taskId: "task-2", reportType: "r2", content: "c2", fileType: "full" },
				{ taskId: "task-3", reportType: "r3", content: "c3", fileType: "full" },
			];

			const results = await Promise.all(inputs.map(saveReport));

			expect(results).toEqual([
				{ success: true },
				{ success: true },
				{ success: true },
			]);
			expect(reportStorage.save).toHaveBeenCalledTimes(3);
		});
	});
});
