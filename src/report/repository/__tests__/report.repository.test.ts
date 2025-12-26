import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { REPORT_TYPES } from "../../../types/report.type";
import { ReportRepository } from "../report.repository";
import { SqliteDatabase } from "../../../storage/sqlite-database";

describe("ReportRepository", () => {
	let database: SqliteDatabase;
	let repository: ReportRepository;

	beforeEach(() => {
		// Use in-memory database for test isolation
		database = new SqliteDatabase(":memory:");
		repository = new ReportRepository(database);
	});

	afterEach(() => {
		database.close();
	});

	describe("save", () => {
		it.concurrent(
			"should save report to database with auto-generated timestamp",
			() => {
				repository.save("task-123", "requirements", "Test content");

				const retrieved = repository.get("task-123", "requirements");
				expect(retrieved).toBeDefined();
				expect(retrieved?.taskId).toBe("task-123");
				expect(retrieved?.reportType).toBe("requirements");
				expect(retrieved?.content).toBe("Test content");
				expect(retrieved?.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO timestamp
			}
		);

		it.concurrent(
			"should overwrite existing report with same key (upsert)",
			() => {
				repository.save("task-123", "requirements", "Original content");
				repository.save("task-123", "requirements", "Updated content");

				const retrieved = repository.get("task-123", "requirements");
				expect(retrieved?.content).toBe("Updated content");
			}
		);

		it.concurrent("should allow same taskId with different reportTypes", () => {
			repository.save("task-123", "requirements", "Requirements content");
			repository.save("task-123", "plan", "Plan content");

			const retrieved1 = repository.get("task-123", "requirements");
			const retrieved2 = repository.get("task-123", "plan");
			expect(retrieved1?.content).toBe("Requirements content");
			expect(retrieved2?.content).toBe("Plan content");
		});

		it.concurrent("should save reports with all 12 report types", () => {
			REPORT_TYPES.forEach((reportType) => {
				repository.save("task-123", reportType, `Content for ${reportType}`);
			});

			REPORT_TYPES.forEach((reportType) => {
				const retrieved = repository.get("task-123", reportType);
				expect(retrieved?.content).toBe(`Content for ${reportType}`);
			});
		});

		it.concurrent("should handle empty content string", () => {
			repository.save("task-123", "requirements", "");

			const retrieved = repository.get("task-123", "requirements");
			expect(retrieved?.content).toBe("");
		});

		it.concurrent("should handle large content", () => {
			const largeContent = "x".repeat(1000000); // 1MB of content
			repository.save("task-123", "requirements", largeContent);

			const retrieved = repository.get("task-123", "requirements");
			expect(retrieved?.content).toBe(largeContent);
			expect(retrieved?.content.length).toBe(1000000);
		});

		it.concurrent("should handle special characters in content", () => {
			const specialContent =
				"Content with unicode: \u0000\u0001\u0002 and emojis: \u{1F600}\nNew lines\tand\ttabs";
			repository.save("task-123", "requirements", specialContent);

			const retrieved = repository.get("task-123", "requirements");
			expect(retrieved?.content).toBe(specialContent);
		});

		it.concurrent("should handle markdown content with code blocks", () => {
			const markdownContent = `# Report Title

## Section 1

\`\`\`typescript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

- Item 1
- Item 2
- Item 3
`;
			repository.save("task-123", "documentation", markdownContent);

			const retrieved = repository.get("task-123", "documentation");
			expect(retrieved?.content).toBe(markdownContent);
		});

		it.concurrent("should handle JSON-like content in string", () => {
			const jsonContent = JSON.stringify({
				key: "value",
				nested: { arr: [1, 2, 3] },
			});
			repository.save("task-123", "requirements", jsonContent);

			const retrieved = repository.get("task-123", "requirements");
			expect(retrieved?.content).toBe(jsonContent);
		});
	});

	describe("get", () => {
		it.concurrent("should return stored report when found", () => {
			repository.save("task-123", "requirements", "Test content");

			const retrieved = repository.get("task-123", "requirements");

			expect(retrieved).toBeDefined();
			expect(retrieved?.taskId).toBe("task-123");
			expect(retrieved?.reportType).toBe("requirements");
			expect(retrieved?.content).toBe("Test content");
		});

		it.concurrent("should return undefined when report not found", () => {
			const retrieved = repository.get("nonexistent-task", "requirements");

			expect(retrieved).toBeUndefined();
		});

		it.concurrent(
			"should return undefined when taskId exists but reportType does not",
			() => {
				repository.save("task-123", "requirements", "Test content");

				const retrieved = repository.get("task-123", "plan");

				expect(retrieved).toBeUndefined();
			}
		);

		it.concurrent(
			"should return correct report when multiple reports exist",
			() => {
				repository.save("task-1", "requirements", "Content 1");
				repository.save("task-1", "plan", "Content 2");
				repository.save("task-2", "requirements", "Content 3");

				expect(repository.get("task-1", "requirements")?.content).toBe(
					"Content 1"
				);
				expect(repository.get("task-1", "plan")?.content).toBe("Content 2");
				expect(repository.get("task-2", "requirements")?.content).toBe(
					"Content 3"
				);
			}
		);

		it.concurrent("should accept all 12 valid report types", () => {
			REPORT_TYPES.forEach((reportType) => {
				repository.save("task-1", reportType, `Content for ${reportType}`);

				const retrieved = repository.get("task-1", reportType);
				expect(retrieved?.content).toBe(`Content for ${reportType}`);
			});
		});
	});

	describe("clear", () => {
		it.concurrent("should remove all reports from repository", () => {
			repository.save("task-1", "requirements", "Content 1");
			repository.save("task-2", "plan", "Content 2");

			repository.clear();

			expect(repository.get("task-1", "requirements")).toBeUndefined();
			expect(repository.get("task-2", "plan")).toBeUndefined();
		});

		it.concurrent("should allow save after clear", () => {
			repository.save("task-1", "requirements", "Content");
			repository.clear();

			repository.save("task-2", "plan", "New content");

			expect(repository.get("task-2", "plan")?.content).toBe("New content");
		});
	});

	describe("Edge Cases", () => {
		it.concurrent("should handle taskId with colons", () => {
			repository.save("task:with:colons", "requirements", "Content");

			const retrieved = repository.get("task:with:colons", "requirements");
			expect(retrieved?.content).toBe("Content");
		});

		it.concurrent("should handle very long taskId", () => {
			const longTaskId = "task-" + "a".repeat(500);
			repository.save(longTaskId, "requirements", "Content");

			const retrieved = repository.get(longTaskId, "requirements");
			expect(retrieved?.content).toBe("Content");
		});

		it.concurrent("should generate ISO timestamp for savedAt", () => {
			repository.save("task-1", "requirements", "Content");

			const retrieved = repository.get("task-1", "requirements");
			// Check it's a valid ISO timestamp
			expect(retrieved?.savedAt).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
			);
		});
	});
});
