import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { REPORT_TYPES } from "../../../types/report.type";
import type { SignalContent } from "../../schemas/signal-content.schema";
import { SignalRepository } from "../signal.repository";
import { SqliteDatabase } from "../../../storage/sqlite-database";
import { SignalStatus } from "../../types/signal-status.type";

describe("SignalRepository", () => {
	let database: SqliteDatabase;
	let repository: SignalRepository;

	beforeEach(() => {
		// Use in-memory database for test isolation
		database = new SqliteDatabase(":memory:");
		repository = new SignalRepository(database);
	});

	afterEach(() => {
		database.close();
	});

	describe("save", () => {
		it.concurrent("should save signal with auto-generated timestamp", () => {
			const content: SignalContent = {
				status: SignalStatus.PASSED,
				summary: "All requirements met",
			};
			repository.save("task-123", "requirements", content);

			const retrieved = repository.get("task-123", "requirements");
			expect(retrieved).toBeDefined();
			expect(retrieved?.taskId).toBe("task-123");
			expect(retrieved?.signalType).toBe("requirements");
			expect(retrieved?.content).toEqual(content);
			expect(retrieved?.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO timestamp
		});

		it.concurrent(
			"should overwrite existing signal with same key (upsert)",
			() => {
				const content1: SignalContent = {
					status: SignalStatus.FAILED,
					summary: "Original summary",
				};
				const content2: SignalContent = {
					status: SignalStatus.PASSED,
					summary: "Updated summary",
				};

				repository.save("task-123", "requirements", content1);
				repository.save("task-123", "requirements", content2);

				const retrieved = repository.get("task-123", "requirements");
				expect(retrieved?.content).toEqual(content2);
			}
		);

		it.concurrent("should allow same taskId with different signalTypes", () => {
			const content1: SignalContent = {
				status: SignalStatus.PASSED,
				summary: "Requirements passed",
			};
			const content2: SignalContent = {
				status: SignalStatus.PASSED,
				summary: "Plan passed",
			};

			repository.save("task-123", "requirements", content1);
			repository.save("task-123", "plan", content2);

			const retrieved1 = repository.get("task-123", "requirements");
			const retrieved2 = repository.get("task-123", "plan");
			expect(retrieved1?.content).toEqual(content1);
			expect(retrieved2?.content).toEqual(content2);
		});

		it.concurrent("should handle passed status", () => {
			const content: SignalContent = {
				status: SignalStatus.PASSED,
				summary: "Test passed",
			};
			repository.save("task-123", "requirements", content);

			const retrieved = repository.get("task-123", "requirements");
			expect(retrieved?.content.status).toBe(SignalStatus.PASSED);
		});

		it.concurrent("should handle failed status", () => {
			const content: SignalContent = {
				status: SignalStatus.FAILED,
				summary: "Test failed",
			};
			repository.save("task-123", "requirements", content);

			const retrieved = repository.get("task-123", "requirements");
			expect(retrieved?.content.status).toBe(SignalStatus.FAILED);
		});

		it.concurrent("should handle summary with special characters", () => {
			const specialSummary =
				'Summary with "quotes" and \nnewlines and unicode: \u0000\u0001 and emojis: \u{1F600}';
			const content: SignalContent = {
				status: SignalStatus.PASSED,
				summary: specialSummary,
			};

			repository.save("task-123", "requirements", content);

			const retrieved = repository.get("task-123", "requirements");
			expect(retrieved?.content.summary).toBe(specialSummary);
		});

		it.concurrent("should handle empty summary", () => {
			const content: SignalContent = {
				status: SignalStatus.PASSED,
				summary: "",
			};
			repository.save("task-123", "requirements", content);

			const retrieved = repository.get("task-123", "requirements");
			expect(retrieved?.content.summary).toBe("");
		});

		it.concurrent("should handle large summary", () => {
			const largeSummary = "x".repeat(100000); // 100KB summary
			const content: SignalContent = {
				status: SignalStatus.PASSED,
				summary: largeSummary,
			};

			repository.save("task-123", "requirements", content);

			const retrieved = repository.get("task-123", "requirements");
			expect(retrieved?.content.summary).toBe(largeSummary);
			expect(retrieved?.content.summary.length).toBe(100000);
		});

		it.concurrent("should save signals with all 12 signal types", () => {
			REPORT_TYPES.forEach((signalType, index) => {
				const content: SignalContent = {
					status: index % 2 === 0 ? SignalStatus.PASSED : SignalStatus.FAILED,
					summary: `Signal for ${signalType}`,
				};
				repository.save("task-123", signalType, content);
			});

			REPORT_TYPES.forEach((signalType, index) => {
				const retrieved = repository.get("task-123", signalType);
				expect(retrieved?.content.status).toBe(
					index % 2 === 0 ? SignalStatus.PASSED : SignalStatus.FAILED
				);
				expect(retrieved?.content.summary).toBe(`Signal for ${signalType}`);
			});
		});
	});

	describe("get", () => {
		it.concurrent(
			"should return stored signal with deserialized content",
			() => {
				const content: SignalContent = {
					status: SignalStatus.PASSED,
					summary: "Test summary",
				};
				repository.save("task-123", "requirements", content);

				const retrieved = repository.get("task-123", "requirements");

				expect(retrieved?.content).toEqual(content);
				expect(retrieved?.content.status).toBe(SignalStatus.PASSED);
				expect(retrieved?.content.summary).toBe("Test summary");
			}
		);

		it.concurrent("should return undefined when signal not found", () => {
			const retrieved = repository.get("nonexistent-task", "requirements");

			expect(retrieved).toBeUndefined();
		});

		it.concurrent(
			"should return undefined when taskId exists but signalType does not",
			() => {
				const content: SignalContent = {
					status: SignalStatus.PASSED,
					summary: "Test",
				};
				repository.save("task-123", "requirements", content);

				const retrieved = repository.get("task-123", "plan");

				expect(retrieved).toBeUndefined();
			}
		);

		it.concurrent(
			"should return correct signal when multiple signals exist",
			() => {
				repository.save("task-1", "requirements", {
					status: SignalStatus.PASSED,
					summary: "S1",
				});
				repository.save("task-1", "plan", {
					status: SignalStatus.FAILED,
					summary: "S2",
				});
				repository.save("task-2", "requirements", {
					status: SignalStatus.PASSED,
					summary: "S3",
				});

				expect(repository.get("task-1", "requirements")?.content.summary).toBe(
					"S1"
				);
				expect(repository.get("task-1", "plan")?.content.summary).toBe("S2");
				expect(repository.get("task-2", "requirements")?.content.summary).toBe(
					"S3"
				);
			}
		);

		it.concurrent("should accept all 12 valid signal types", () => {
			REPORT_TYPES.forEach((signalType) => {
				const content: SignalContent = {
					status: SignalStatus.PASSED,
					summary: `Signal for ${signalType}`,
				};
				repository.save("task-1", signalType, content);

				const retrieved = repository.get("task-1", signalType);
				expect(retrieved?.content).toEqual(content);
			});
		});
	});

	describe("clear", () => {
		it.concurrent("should remove all signals from repository", () => {
			repository.save("task-1", "requirements", {
				status: SignalStatus.PASSED,
				summary: "S1",
			});
			repository.save("task-2", "plan", {
				status: SignalStatus.FAILED,
				summary: "S2",
			});

			repository.clear();

			expect(repository.get("task-1", "requirements")).toBeUndefined();
			expect(repository.get("task-2", "plan")).toBeUndefined();
		});

		it.concurrent("should allow save after clear", () => {
			repository.save("task-1", "requirements", {
				status: SignalStatus.PASSED,
				summary: "S1",
			});
			repository.clear();

			repository.save("task-2", "plan", {
				status: SignalStatus.FAILED,
				summary: "S2",
			});

			expect(repository.get("task-2", "plan")?.content.summary).toBe("S2");
		});
	});

	describe("JSON Serialization/Deserialization", () => {
		it.concurrent("should correctly serialize SignalContent to JSON", () => {
			const content: SignalContent = {
				status: SignalStatus.PASSED,
				summary: "Test summary",
			};
			repository.save("task-123", "requirements", content);

			const retrieved = repository.get("task-123", "requirements");
			expect(typeof retrieved?.content).toBe("object");
			expect(retrieved?.content.status).toBe(SignalStatus.PASSED);
			expect(retrieved?.content.summary).toBe("Test summary");
		});

		it.concurrent("should preserve content structure after round-trip", () => {
			const originalContent: SignalContent = {
				status: SignalStatus.FAILED,
				summary: "Detailed failure summary with special chars: <>\"'&",
			};
			repository.save("task-123", "requirements", originalContent);

			const retrieved = repository.get("task-123", "requirements");
			expect(retrieved?.content).toEqual(originalContent);
		});
	});

	describe("Edge Cases", () => {
		it.concurrent("should handle taskId with colons", () => {
			const content: SignalContent = {
				status: SignalStatus.PASSED,
				summary: "Test",
			};
			repository.save("task:with:colons", "requirements", content);

			const retrieved = repository.get("task:with:colons", "requirements");
			expect(retrieved?.content).toEqual(content);
		});

		it.concurrent("should handle very long taskId", () => {
			const longTaskId = "task-" + "a".repeat(500);
			const content: SignalContent = {
				status: SignalStatus.PASSED,
				summary: "Test",
			};

			repository.save(longTaskId, "requirements", content);

			const retrieved = repository.get(longTaskId, "requirements");
			expect(retrieved?.content).toEqual(content);
		});

		it.concurrent("should generate ISO timestamp for savedAt", () => {
			const content: SignalContent = {
				status: SignalStatus.PASSED,
				summary: "Test",
			};
			repository.save("task-1", "requirements", content);

			const retrieved = repository.get("task-1", "requirements");
			// Check it's a valid ISO timestamp
			expect(retrieved?.savedAt).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
			);
		});
	});
});
