import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReportRepositoryImpl } from "../report.repository";
import type { IReportStorage } from "../../types/report-storage.interface";
import type { ReportType } from "../../../types/report.type";
import type { IStoredReport } from "../../types/stored-report.interface";

// Create mock report-repository
const mockStorage: IReportStorage = {
	save: vi.fn(),
	get: vi.fn(),
	clear: vi.fn(),
	generateKey: vi.fn(
		(taskId: string, reportType: string) => `${taskId}:${reportType}`
	),
};

// Create repository with mock report-repository
const reportRepository = new ReportRepositoryImpl(mockStorage);

describe("ReportRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Mock Date.now for consistent timestamps
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-01-15T10:30:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("Create ReportRepository Class", () => {
		it("should be instantiable with report-repository dependency", () => {
			const repo = new ReportRepositoryImpl(mockStorage);
			expect(repo).toBeDefined();
			expect(typeof repo).toBe("object");
		});

		it("should have save method", () => {
			expect(typeof reportRepository.save).toBe("function");
		});

		it("should have get method", () => {
			expect(typeof reportRepository.get).toBe("function");
		});

		it("should have clear method", () => {
			expect(typeof reportRepository.clear).toBe("function");
		});
	});

	describe("save() method with timestamp generation", () => {
		it("should generate ISO timestamp when saving a report", () => {
			const taskId = "develop-feature-auth-123";
			const reportType: ReportType = "requirements";
			const content = "# Requirements Report\n\nThis is the content.";

			reportRepository.save(taskId, reportType, content);

			expect(mockStorage.save).toHaveBeenCalledWith({
				taskId: "develop-feature-auth-123",
				reportType: "requirements",
				content: "# Requirements Report\n\nThis is the content.",
				savedAt: "2025-01-15T10:30:00.000Z",
			});
		});

		it("should delegate to internal report-repository with correct StoredReport object", () => {
			const taskId = "task-123";
			const reportType: ReportType = "plan";
			const content = "# Plan Content";

			reportRepository.save(taskId, reportType, content);

			expect(mockStorage.save).toHaveBeenCalledTimes(1);
			expect(mockStorage.save).toHaveBeenCalledWith(
				expect.objectContaining({
					taskId: "task-123",
					reportType: "plan",
					content: "# Plan Content",
				})
			);
		});

		it("should generate different timestamps for saves at different times", () => {
			const taskId = "task-123";
			const reportType: ReportType = "requirements";

			reportRepository.save(taskId, reportType, "First content");

			// Advance time by 1 minute
			vi.advanceTimersByTime(60000);

			reportRepository.save(taskId, reportType, "Second content");

			// Verify first call had original timestamp
			expect(mockStorage.save).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({
					savedAt: "2025-01-15T10:30:00.000Z",
				})
			);

			// Verify second call had updated timestamp
			expect(mockStorage.save).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({
					savedAt: "2025-01-15T10:31:00.000Z",
				})
			);
		});

		it("should accept all 12 valid report types", () => {
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

			validTypes.forEach((reportType) => {
				reportRepository.save(
					"task-id",
					reportType,
					`Content for ${reportType}`
				);
			});

			expect(mockStorage.save).toHaveBeenCalledTimes(12);
		});

		it("should handle empty content string", () => {
			reportRepository.save("task-123", "requirements", "");

			expect(mockStorage.save).toHaveBeenCalledWith(
				expect.objectContaining({
					content: "",
				})
			);
		});

		it("should handle content with special characters", () => {
			const specialContent =
				"Content with unicode: \u0000\u0001\u0002 and emojis: \uD83D\uDE00";

			reportRepository.save("task-123", "requirements", specialContent);

			expect(mockStorage.save).toHaveBeenCalledWith(
				expect.objectContaining({
					content: specialContent,
				})
			);
		});

		it("should handle large content", () => {
			const largeContent = "x".repeat(1000000); // 1MB of content

			reportRepository.save("task-123", "requirements", largeContent);

			expect(mockStorage.save).toHaveBeenCalledWith(
				expect.objectContaining({
					content: largeContent,
				})
			);
		});
	});

	describe("get() method", () => {
		it("should delegate to internal report-repository and return StoredReport when found", () => {
			const storedReport: IStoredReport = {
				taskId: "develop-feature-auth-123",
				reportType: "requirements",
				content: "# Requirements Report\n\nThis is the content.",
				savedAt: "2025-01-15T10:30:00.000Z",
			};

			vi.mocked(mockStorage.get).mockReturnValueOnce(storedReport);

			const result = reportRepository.get(
				"develop-feature-auth-123",
				"requirements"
			);

			expect(mockStorage.get).toHaveBeenCalledWith(
				"develop-feature-auth-123",
				"requirements"
			);
			expect(result).toEqual(storedReport);
		});

		it("should return undefined when report not found", () => {
			vi.mocked(mockStorage.get).mockReturnValueOnce(undefined);

			const result = reportRepository.get("non-existent-task", "requirements");

			expect(mockStorage.get).toHaveBeenCalledWith(
				"non-existent-task",
				"requirements"
			);
			expect(result).toBeUndefined();
		});

		it("should call report-repository.get with correct taskId and reportType", () => {
			vi.mocked(mockStorage.get).mockReturnValueOnce(undefined);

			reportRepository.get("my-task-id", "implementation");

			expect(mockStorage.get).toHaveBeenCalledWith(
				"my-task-id",
				"implementation"
			);
		});

		it("should accept all 12 valid report types", () => {
			vi.mocked(mockStorage.get).mockReturnValue(undefined);

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

			validTypes.forEach((reportType) => {
				reportRepository.get("task-id", reportType);
			});

			expect(mockStorage.get).toHaveBeenCalledTimes(12);
		});
	});

	describe("clear() method", () => {
		it("should delegate to internal report-repository clear method", () => {
			reportRepository.clear();

			expect(mockStorage.clear).toHaveBeenCalledTimes(1);
		});

		it("should be callable for test isolation", () => {
			expect(() => reportRepository.clear()).not.toThrow();
		});
	});

	describe("Edge Cases", () => {
		it("should handle taskId with various formats", () => {
			const taskIds = [
				"develop-feature-auth-123",
				"fix-bug-login-1234567890",
				"simple",
				"with_underscores",
				"123-starting-with-numbers",
			];

			taskIds.forEach((taskId) => {
				reportRepository.save(taskId, "requirements", "content");
			});

			expect(mockStorage.save).toHaveBeenCalledTimes(5);
		});

		it("should handle concurrent save calls", async () => {
			const saves = [
				Promise.resolve().then(() =>
					reportRepository.save("task-1", "requirements", "c1")
				),
				Promise.resolve().then(() =>
					reportRepository.save("task-2", "plan", "c2")
				),
				Promise.resolve().then(() =>
					reportRepository.save("task-3", "implementation", "c3")
				),
			];

			await Promise.all(saves);

			expect(mockStorage.save).toHaveBeenCalledTimes(3);
		});

		it("should handle concurrent get calls", async () => {
			vi.mocked(mockStorage.get).mockReturnValue(undefined);

			const gets = [
				Promise.resolve().then(() =>
					reportRepository.get("task-1", "requirements")
				),
				Promise.resolve().then(() => reportRepository.get("task-2", "plan")),
				Promise.resolve().then(() =>
					reportRepository.get("task-3", "implementation")
				),
			];

			await Promise.all(gets);

			expect(mockStorage.get).toHaveBeenCalledTimes(3);
		});
	});
});
