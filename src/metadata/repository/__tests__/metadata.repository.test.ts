import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ExecutionStep } from "../../../types/execution-step.type";
import type { ReportType } from "../../../types/report.type";
import type { StoredMetadata } from "../../types/stored-metadata.interface";
import { MetadataRepository } from "../metadata.repository";
import { SqliteDatabase } from "../../../storage/sqlite-database";

describe("MetadataRepository", () => {
	let database: SqliteDatabase;
	let repository: MetadataRepository;

	beforeEach(() => {
		// Use in-memory database for test isolation
		database = new SqliteDatabase(":memory:");
		repository = new MetadataRepository(database);
	});

	afterEach(() => {
		database.close();
	});

	describe("save", () => {
		it.concurrent("should save metadata to database", () => {
			const metadata: StoredMetadata = {
				taskId: "task-123",
				startedAt: "2025-01-15T10:00:00.000Z",
				savedAt: "2025-01-15T10:30:00.000Z",
				executionSteps: ["requirements", "plan", "implementation"],
				currentStepIndex: 0,
			};

			repository["save"](metadata);

			const retrieved = repository.get("task-123");
			expect(retrieved).toEqual(metadata);
		});

		it.concurrent(
			"should overwrite existing metadata with same taskId (upsert)",
			() => {
				const metadata1: StoredMetadata = {
					taskId: "task-123",
					startedAt: "2025-01-15T10:00:00.000Z",
					savedAt: "2025-01-15T10:30:00.000Z",
					executionSteps: ["requirements"],
					currentStepIndex: 0,
				};
				const metadata2: StoredMetadata = {
					taskId: "task-123",
					startedAt: "2025-01-15T10:00:00.000Z",
					savedAt: "2025-01-15T11:30:00.000Z",
					executionSteps: ["requirements", "plan"],
					currentStepIndex: 1,
				};

				repository["save"](metadata1);
				repository["save"](metadata2);

				const retrieved = repository.get("task-123");
				expect(retrieved).toEqual(metadata2);
			}
		);

		it.concurrent("should allow multiple different taskIds", () => {
			const metadata1: StoredMetadata = {
				taskId: "task-1",
				startedAt: "2025-01-15T10:00:00.000Z",
				savedAt: "2025-01-15T10:30:00.000Z",
				executionSteps: ["requirements"],
				currentStepIndex: 0,
			};
			const metadata2: StoredMetadata = {
				taskId: "task-2",
				startedAt: "2025-01-15T11:00:00.000Z",
				savedAt: "2025-01-15T11:30:00.000Z",
				executionSteps: ["plan"],
				currentStepIndex: 0,
			};

			repository["save"](metadata1);
			repository["save"](metadata2);

			expect(repository.get("task-1")).toEqual(metadata1);
			expect(repository.get("task-2")).toEqual(metadata2);
		});

		it.concurrent("should serialize executionSteps array to JSON", () => {
			const executionSteps: ExecutionStep[] = [
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
			const metadata: StoredMetadata = {
				taskId: "task-123",
				startedAt: "2025-01-15T10:00:00.000Z",
				savedAt: "2025-01-15T10:30:00.000Z",
				executionSteps,
				currentStepIndex: 0,
			};

			repository["save"](metadata);

			const retrieved = repository.get("task-123");
			expect(retrieved?.executionSteps).toEqual(executionSteps);
			expect(retrieved?.executionSteps.length).toBe(12);
		});

		it.concurrent(
			"should serialize nested arrays (parallel steps) to JSON",
			() => {
				const executionSteps: ExecutionStep[] = [
					"requirements",
					"plan",
					["tests-design", "tests-review"],
					"implementation",
					["performance", "security"],
					"documentation",
				];
				const metadata: StoredMetadata = {
					taskId: "task-123",
					startedAt: "2025-01-15T10:00:00.000Z",
					savedAt: "2025-01-15T10:30:00.000Z",
					executionSteps,
					currentStepIndex: 0,
				};

				repository["save"](metadata);

				const retrieved = repository.get("task-123");
				expect(retrieved?.executionSteps).toEqual(executionSteps);
				expect(Array.isArray(retrieved?.executionSteps[2])).toBe(true);
				expect(retrieved?.executionSteps[2]).toEqual([
					"tests-design",
					"tests-review",
				]);
			}
		);

		it.concurrent("should handle nullable completedAt", () => {
			const metadata: StoredMetadata = {
				taskId: "task-123",
				startedAt: "2025-01-15T10:00:00.000Z",
				savedAt: "2025-01-15T10:30:00.000Z",
				executionSteps: ["requirements"],
				currentStepIndex: 0,
			};

			repository["save"](metadata);

			const retrieved = repository.get("task-123");
			expect(retrieved?.completedAt).toBeUndefined();
		});

		it.concurrent("should handle defined completedAt", () => {
			const metadata: StoredMetadata = {
				taskId: "task-123",
				startedAt: "2025-01-15T10:00:00.000Z",
				completedAt: "2025-01-15T12:00:00.000Z",
				savedAt: "2025-01-15T12:00:00.000Z",
				executionSteps: ["requirements"],
				currentStepIndex: 0,
			};

			repository["save"](metadata);

			const retrieved = repository.get("task-123");
			expect(retrieved?.completedAt).toBe("2025-01-15T12:00:00.000Z");
		});

		it.concurrent("should handle empty executionSteps array", () => {
			const metadata: StoredMetadata = {
				taskId: "task-123",
				startedAt: "2025-01-15T10:00:00.000Z",
				savedAt: "2025-01-15T10:30:00.000Z",
				executionSteps: [],
				currentStepIndex: 0,
			};

			repository["save"](metadata);

			const retrieved = repository.get("task-123");
			expect(retrieved?.executionSteps).toEqual([]);
		});

		it.concurrent("should handle various currentStepIndex values", () => {
			const testCases = [0, 1, 5, 11];

			testCases.forEach((index) => {
				const metadata: StoredMetadata = {
					taskId: `task-${index}`,
					startedAt: "2025-01-15T10:00:00.000Z",
					savedAt: "2025-01-15T10:30:00.000Z",
					executionSteps: ["requirements", "plan"],
					currentStepIndex: index,
				};

				repository["save"](metadata);

				const retrieved = repository.get(`task-${index}`);
				expect(retrieved?.currentStepIndex).toBe(index);
			});
		});
	});

	describe("get", () => {
		it.concurrent("should return stored metadata when found", () => {
			const metadata: StoredMetadata = {
				taskId: "task-123",
				startedAt: "2025-01-15T10:00:00.000Z",
				savedAt: "2025-01-15T10:30:00.000Z",
				executionSteps: ["requirements", "plan"],
				currentStepIndex: 1,
			};
			repository["save"](metadata);

			const retrieved = repository.get("task-123");

			expect(retrieved).toEqual(metadata);
		});

		it.concurrent("should return undefined when metadata not found", () => {
			const retrieved = repository.get("nonexistent-task");

			expect(retrieved).toBeUndefined();
		});

		it.concurrent("should deserialize JSON back to ExecutionStep array", () => {
			const executionSteps: ExecutionStep[] = [
				"requirements",
				["plan", "tests-design"],
				"implementation",
			];
			const metadata: StoredMetadata = {
				taskId: "task-123",
				startedAt: "2025-01-15T10:00:00.000Z",
				savedAt: "2025-01-15T10:30:00.000Z",
				executionSteps,
				currentStepIndex: 0,
			};
			repository["save"](metadata);

			const retrieved = repository.get("task-123");

			expect(Array.isArray(retrieved?.executionSteps)).toBe(true);
			expect(retrieved?.executionSteps).toEqual(executionSteps);
		});

		it.concurrent(
			"should return correct metadata when multiple metadata exist",
			() => {
				const metadataList: StoredMetadata[] = [
					{
						taskId: "task-1",
						startedAt: "2025-01-15T10:00:00.000Z",
						savedAt: "2025-01-15T10:30:00.000Z",
						executionSteps: ["requirements"],
						currentStepIndex: 0,
					},
					{
						taskId: "task-2",
						startedAt: "2025-01-15T11:00:00.000Z",
						savedAt: "2025-01-15T11:30:00.000Z",
						executionSteps: ["plan"],
						currentStepIndex: 0,
					},
					{
						taskId: "task-3",
						startedAt: "2025-01-15T12:00:00.000Z",
						savedAt: "2025-01-15T12:30:00.000Z",
						executionSteps: ["implementation"],
						currentStepIndex: 0,
					},
				];
				metadataList.forEach((m) => repository["save"](m));

				expect(repository.get("task-1")).toEqual(metadataList[0]);
				expect(repository.get("task-2")).toEqual(metadataList[1]);
				expect(repository.get("task-3")).toEqual(metadataList[2]);
			}
		);
	});

	describe("clear", () => {
		it.concurrent("should remove all metadata from repository", () => {
			const metadataList: StoredMetadata[] = [
				{
					taskId: "task-1",
					startedAt: "2025-01-15T10:00:00.000Z",
					savedAt: "2025-01-15T10:30:00.000Z",
					executionSteps: ["requirements"],
					currentStepIndex: 0,
				},
				{
					taskId: "task-2",
					startedAt: "2025-01-15T11:00:00.000Z",
					savedAt: "2025-01-15T11:30:00.000Z",
					executionSteps: ["plan"],
					currentStepIndex: 0,
				},
			];
			metadataList.forEach((m) => repository["save"](m));

			repository.clear();

			expect(repository.get("task-1")).toBeUndefined();
			expect(repository.get("task-2")).toBeUndefined();
		});

		it.concurrent("should allow save after clear", () => {
			const metadata: StoredMetadata = {
				taskId: "task-1",
				startedAt: "2025-01-15T10:00:00.000Z",
				savedAt: "2025-01-15T10:30:00.000Z",
				executionSteps: ["requirements"],
				currentStepIndex: 0,
			};
			repository["save"](metadata);
			repository.clear();

			const newMetadata: StoredMetadata = {
				taskId: "task-2",
				startedAt: "2025-01-15T11:00:00.000Z",
				savedAt: "2025-01-15T11:30:00.000Z",
				executionSteps: ["plan"],
				currentStepIndex: 0,
			};
			repository["save"](newMetadata);

			expect(repository.get("task-2")).toEqual(newMetadata);
		});

		it.concurrent("should not throw when clearing empty repository", () => {
			expect(() => repository.clear()).not.toThrow();
		});

		it.concurrent("should be callable multiple times", () => {
			const metadata: StoredMetadata = {
				taskId: "task-1",
				startedAt: "2025-01-15T10:00:00.000Z",
				savedAt: "2025-01-15T10:30:00.000Z",
				executionSteps: ["requirements"],
				currentStepIndex: 0,
			};
			repository["save"](metadata);

			expect(() => {
				repository.clear();
				repository.clear();
			}).not.toThrow();
		});
	});

	describe("JSON Serialization/Deserialization", () => {
		it.concurrent(
			"should correctly serialize and deserialize simple ExecutionStep array",
			() => {
				const executionSteps: ExecutionStep[] = [
					"requirements",
					"plan",
					"implementation",
				];
				const metadata: StoredMetadata = {
					taskId: "task-123",
					startedAt: "2025-01-15T10:00:00.000Z",
					savedAt: "2025-01-15T10:30:00.000Z",
					executionSteps,
					currentStepIndex: 0,
				};

				repository["save"](metadata);
				const retrieved = repository.get("task-123");

				expect(retrieved?.executionSteps).toEqual(executionSteps);
			}
		);

		it.concurrent(
			"should correctly serialize and deserialize nested ExecutionStep array",
			() => {
				const executionSteps: ExecutionStep[] = [
					"requirements",
					["plan", "tests-design"],
					"implementation",
					["performance", "security", "code-review"],
					"documentation",
				];
				const metadata: StoredMetadata = {
					taskId: "task-123",
					startedAt: "2025-01-15T10:00:00.000Z",
					savedAt: "2025-01-15T10:30:00.000Z",
					executionSteps,
					currentStepIndex: 0,
				};

				repository["save"](metadata);
				const retrieved = repository.get("task-123");

				expect(retrieved?.executionSteps).toEqual(executionSteps);
				expect(Array.isArray(retrieved?.executionSteps[1])).toBe(true);
				expect(Array.isArray(retrieved?.executionSteps[3])).toBe(true);
			}
		);

		it.concurrent(
			"should preserve all 12 report types in execution steps",
			() => {
				const allReportTypes: ReportType[] = [
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
				const metadata: StoredMetadata = {
					taskId: "task-123",
					startedAt: "2025-01-15T10:00:00.000Z",
					savedAt: "2025-01-15T10:30:00.000Z",
					executionSteps: allReportTypes,
					currentStepIndex: 0,
				};

				repository["save"](metadata);
				const retrieved = repository.get("task-123");

				expect(retrieved?.executionSteps).toEqual(allReportTypes);
			}
		);
	});

	describe("Edge Cases", () => {
		it.concurrent("should handle taskId with colons", () => {
			const metadata: StoredMetadata = {
				taskId: "task:with:colons",
				startedAt: "2025-01-15T10:00:00.000Z",
				savedAt: "2025-01-15T10:30:00.000Z",
				executionSteps: ["requirements"],
				currentStepIndex: 0,
			};

			repository["save"](metadata);

			const retrieved = repository.get("task:with:colons");
			expect(retrieved).toEqual(metadata);
		});

		it.concurrent("should handle very long taskId", () => {
			const longTaskId = "task-" + "a".repeat(500);
			const metadata: StoredMetadata = {
				taskId: longTaskId,
				startedAt: "2025-01-15T10:00:00.000Z",
				savedAt: "2025-01-15T10:30:00.000Z",
				executionSteps: ["requirements"],
				currentStepIndex: 0,
			};

			repository["save"](metadata);

			const retrieved = repository.get(longTaskId);
			expect(retrieved).toEqual(metadata);
		});

		it.concurrent("should preserve exact timestamps", () => {
			const metadata: StoredMetadata = {
				taskId: "task-1",
				startedAt: "2025-01-15T10:30:45.123Z",
				completedAt: "2025-01-15T12:45:30.456Z",
				savedAt: "2025-01-15T12:45:30.789Z",
				executionSteps: ["requirements"],
				currentStepIndex: 0,
			};

			repository["save"](metadata);

			const retrieved = repository.get("task-1");
			expect(retrieved?.startedAt).toBe("2025-01-15T10:30:45.123Z");
			expect(retrieved?.completedAt).toBe("2025-01-15T12:45:30.456Z");
			expect(retrieved?.savedAt).toBe("2025-01-15T12:45:30.789Z");
		});

		it.concurrent("should handle large currentStepIndex", () => {
			const metadata: StoredMetadata = {
				taskId: "task-123",
				startedAt: "2025-01-15T10:00:00.000Z",
				savedAt: "2025-01-15T10:30:00.000Z",
				executionSteps: ["requirements"],
				currentStepIndex: 999999,
			};

			repository["save"](metadata);

			const retrieved = repository.get("task-123");
			expect(retrieved?.currentStepIndex).toBe(999999);
		});
	});
});
