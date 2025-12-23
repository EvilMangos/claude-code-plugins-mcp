import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReportType } from "../../types/report.type";
import { MetadataService } from "../metadata.service";
import type { StoredMetadata } from "../types/stored-metadata.interface";
import { createMockMetadataRepository } from "../repository/__mocks__/metadata.repository.mock";

// Create mock repository
const mockRepository = createMockMetadataRepository();

// Create service with mock repository
const metadataService = new MetadataService(mockRepository);

describe("MetadataService.getNextStep", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Basic Functionality", () => {
		it.concurrent(
			"should return the current step for in-progress workflow",
			async () => {
				const metadata: StoredMetadata = {
					taskId: "task-123",
					startedAt: "2024-01-01T00:00:00.000Z",
					savedAt: "2024-01-01T00:00:00.000Z",
					executionSteps: ["requirements", "plan", "implementation"],
					currentStepIndex: 0,
				};
				vi.mocked(mockRepository.get).mockReturnValue(metadata);

				const result = await metadataService.getNextStep({
					taskId: "task-123",
				});

				expect(result).toEqual({
					success: true,
					taskId: "task-123",
					stepNumber: 1,
					totalSteps: 3,
					step: "requirements",
					complete: false,
				});
			}
		);

		it.concurrent("should return step 2 when at index 1", async () => {
			const metadata: StoredMetadata = {
				taskId: "task-123",
				startedAt: "2024-01-01T00:00:00.000Z",
				savedAt: "2024-01-01T00:00:00.000Z",
				executionSteps: ["requirements", "plan", "implementation"],
				currentStepIndex: 1,
			};
			vi.mocked(mockRepository.get).mockReturnValue(metadata);

			const result = await metadataService.getNextStep({ taskId: "task-123" });

			expect(result).toEqual({
				success: true,
				taskId: "task-123",
				stepNumber: 2,
				totalSteps: 3,
				step: "plan",
				complete: false,
			});
		});

		it.concurrent("should return correct totalSteps", async () => {
			const metadata: StoredMetadata = {
				taskId: "task-123",
				startedAt: "2024-01-01T00:00:00.000Z",
				savedAt: "2024-01-01T00:00:00.000Z",
				executionSteps: [
					"requirements",
					"plan",
					"tests-design",
					"implementation",
					"documentation",
				],
				currentStepIndex: 0,
			};
			vi.mocked(mockRepository.get).mockReturnValue(metadata);

			const result = await metadataService.getNextStep({ taskId: "task-123" });

			expect(result.totalSteps).toBe(5);
		});
	});

	describe("Completion Detection", () => {
		it.concurrent(
			"should return complete: true when completedAt is set",
			async () => {
				const metadata: StoredMetadata = {
					taskId: "task-123",
					startedAt: "2024-01-01T00:00:00.000Z",
					completedAt: "2024-01-01T01:00:00.000Z",
					savedAt: "2024-01-01T01:00:00.000Z",
					executionSteps: ["requirements", "plan", "implementation"],
					currentStepIndex: 2,
				};
				vi.mocked(mockRepository.get).mockReturnValue(metadata);

				const result = await metadataService.getNextStep({
					taskId: "task-123",
				});

				expect(result.complete).toBe(true);
			}
		);

		it.concurrent(
			"should return step: undefined when workflow is complete",
			async () => {
				const metadata: StoredMetadata = {
					taskId: "task-123",
					startedAt: "2024-01-01T00:00:00.000Z",
					completedAt: "2024-01-01T01:00:00.000Z",
					savedAt: "2024-01-01T01:00:00.000Z",
					executionSteps: ["requirements", "plan", "implementation"],
					currentStepIndex: 2,
				};
				vi.mocked(mockRepository.get).mockReturnValue(metadata);

				const result = await metadataService.getNextStep({
					taskId: "task-123",
				});

				expect(result.step).toBeUndefined();
			}
		);

		it.concurrent(
			"should return complete: false when completedAt is not set",
			async () => {
				const metadata: StoredMetadata = {
					taskId: "task-123",
					startedAt: "2024-01-01T00:00:00.000Z",
					savedAt: "2024-01-01T00:00:00.000Z",
					executionSteps: ["requirements", "plan", "implementation"],
					currentStepIndex: 2,
				};
				vi.mocked(mockRepository.get).mockReturnValue(metadata);

				const result = await metadataService.getNextStep({
					taskId: "task-123",
				});

				expect(result.complete).toBe(false);
				expect(result.step).toBe("implementation");
			}
		);

		it.concurrent(
			"should still return stepNumber and totalSteps when complete",
			async () => {
				const metadata: StoredMetadata = {
					taskId: "task-123",
					startedAt: "2024-01-01T00:00:00.000Z",
					completedAt: "2024-01-01T01:00:00.000Z",
					savedAt: "2024-01-01T01:00:00.000Z",
					executionSteps: ["requirements", "plan", "implementation"],
					currentStepIndex: 2,
				};
				vi.mocked(mockRepository.get).mockReturnValue(metadata);

				const result = await metadataService.getNextStep({
					taskId: "task-123",
				});

				expect(result.stepNumber).toBe(3);
				expect(result.totalSteps).toBe(3);
			}
		);
	});

	describe("Error Handling", () => {
		it.concurrent("should return error when metadata not found", async () => {
			vi.mocked(mockRepository.get).mockReturnValue(undefined);

			const result = await metadataService.getNextStep({
				taskId: "nonexistent",
			});

			expect(result).toEqual({
				success: false,
				error: "Metadata not found for taskId: nonexistent",
			});
		});

		it.concurrent("should return error when taskId is empty", async () => {
			const result = await metadataService.getNextStep({ taskId: "" });

			expect(result.success).toBe(false);
			expect(result.error).toContain("taskId");
		});

		it.concurrent(
			"should return error when taskId is whitespace only",
			async () => {
				const result = await metadataService.getNextStep({ taskId: "   " });

				expect(result.success).toBe(false);
				expect(result.error).toContain("taskId");
			}
		);

		it.concurrent("should handle repository errors gracefully", async () => {
			vi.mocked(mockRepository.get).mockImplementation(() => {
				throw new Error("Repository failure");
			});

			const result = await metadataService.getNextStep({ taskId: "task-123" });

			expect(result).toEqual({
				success: false,
				error: expect.stringContaining("Repository failure"),
			});
		});
	});

	describe("Full 12-Step Workflow", () => {
		const fullWorkflowSteps: ReportType[] = [
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

		it.concurrent("should handle 12-step workflow at first step", async () => {
			const metadata: StoredMetadata = {
				taskId: "full-workflow",
				startedAt: "2024-01-01T00:00:00.000Z",
				savedAt: "2024-01-01T00:00:00.000Z",
				executionSteps: fullWorkflowSteps,
				currentStepIndex: 0,
			};
			vi.mocked(mockRepository.get).mockReturnValue(metadata);

			const result = await metadataService.getNextStep({
				taskId: "full-workflow",
			});

			expect(result).toEqual({
				success: true,
				taskId: "full-workflow",
				stepNumber: 1,
				totalSteps: 12,
				step: "requirements",
				complete: false,
			});
		});

		it.concurrent(
			"should handle 12-step workflow at last step (not complete)",
			async () => {
				const metadata: StoredMetadata = {
					taskId: "full-workflow",
					startedAt: "2024-01-01T00:00:00.000Z",
					savedAt: "2024-01-01T00:00:00.000Z",
					executionSteps: fullWorkflowSteps,
					currentStepIndex: 11,
				};
				vi.mocked(mockRepository.get).mockReturnValue(metadata);

				const result = await metadataService.getNextStep({
					taskId: "full-workflow",
				});

				expect(result).toEqual({
					success: true,
					taskId: "full-workflow",
					stepNumber: 12,
					totalSteps: 12,
					step: "documentation",
					complete: false,
				});
			}
		);

		it.concurrent("should handle 12-step workflow when complete", async () => {
			const metadata: StoredMetadata = {
				taskId: "full-workflow",
				startedAt: "2024-01-01T00:00:00.000Z",
				completedAt: "2024-01-01T02:00:00.000Z",
				savedAt: "2024-01-01T02:00:00.000Z",
				executionSteps: fullWorkflowSteps,
				currentStepIndex: 11,
			};
			vi.mocked(mockRepository.get).mockReturnValue(metadata);

			const result = await metadataService.getNextStep({
				taskId: "full-workflow",
			});

			expect(result).toEqual({
				success: true,
				taskId: "full-workflow",
				stepNumber: 12,
				totalSteps: 12,
				step: undefined,
				complete: true,
			});
		});
	});
});
