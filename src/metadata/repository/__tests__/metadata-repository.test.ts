import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReportType } from "../../../types/report.type";
import type { IMetadataStorage } from "../../types/metadata-storage.interface";
import type { IStoredMetadata } from "../../types/stored-metadata.interface";
import { MetadataRepositoryImpl } from "../metadata.repository";

// Create mock storage
const mockStorage: IMetadataStorage = {
	save: vi.fn(),
	get: vi.fn(),
	exists: vi.fn(),
	clear: vi.fn(),
};

// Create repository with mock storage
const metadataRepository = new MetadataRepositoryImpl(mockStorage);

describe("MetadataRepository.incrementStep", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-01T12:00:00.000Z"));
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	describe("Normal Progression", () => {
		it("should increment step from 0 to 1", () => {
			const metadata: IStoredMetadata = {
				taskId: "task-123",
				startedAt: "2024-01-01T00:00:00.000Z",
				savedAt: "2024-01-01T00:00:00.000Z",
				executionSteps: ["requirements", "plan", "implementation"],
				currentStepIndex: 0,
			};
			vi.mocked(mockStorage.get).mockReturnValue(metadata);

			metadataRepository.incrementStep("task-123");

			expect(mockStorage.save).toHaveBeenCalledWith({
				...metadata,
				currentStepIndex: 1,
				savedAt: "2024-01-01T12:00:00.000Z",
			});
		});

		it("should increment step from 1 to 2", () => {
			const metadata: IStoredMetadata = {
				taskId: "task-123",
				startedAt: "2024-01-01T00:00:00.000Z",
				savedAt: "2024-01-01T00:00:00.000Z",
				executionSteps: ["requirements", "plan", "implementation"],
				currentStepIndex: 1,
			};
			vi.mocked(mockStorage.get).mockReturnValue(metadata);

			metadataRepository.incrementStep("task-123");

			expect(mockStorage.save).toHaveBeenCalledWith({
				...metadata,
				currentStepIndex: 2,
				savedAt: "2024-01-01T12:00:00.000Z",
			});
		});
	});

	describe("Completion Detection", () => {
		it("should set completedAt when incrementing from last step", () => {
			const metadata: IStoredMetadata = {
				taskId: "task-123",
				startedAt: "2024-01-01T00:00:00.000Z",
				savedAt: "2024-01-01T00:00:00.000Z",
				executionSteps: ["requirements", "plan", "implementation"],
				currentStepIndex: 2, // Last step (index 2 of 3 steps)
			};
			vi.mocked(mockStorage.get).mockReturnValue(metadata);

			metadataRepository.incrementStep("task-123");

			expect(mockStorage.save).toHaveBeenCalledWith({
				...metadata,
				completedAt: "2024-01-01T12:00:00.000Z",
				savedAt: "2024-01-01T12:00:00.000Z",
			});
		});

		it("should not increment currentStepIndex when setting completedAt", () => {
			const metadata: IStoredMetadata = {
				taskId: "task-123",
				startedAt: "2024-01-01T00:00:00.000Z",
				savedAt: "2024-01-01T00:00:00.000Z",
				executionSteps: ["requirements", "plan", "implementation"],
				currentStepIndex: 2,
			};
			vi.mocked(mockStorage.get).mockReturnValue(metadata);

			metadataRepository.incrementStep("task-123");

			const savedMetadata = vi.mocked(mockStorage.save).mock.calls[0][0];
			expect(savedMetadata.currentStepIndex).toBe(2);
			expect(savedMetadata.completedAt).toBe("2024-01-01T12:00:00.000Z");
		});

		it("should handle single-step workflow completion", () => {
			const metadata: IStoredMetadata = {
				taskId: "task-123",
				startedAt: "2024-01-01T00:00:00.000Z",
				savedAt: "2024-01-01T00:00:00.000Z",
				executionSteps: ["requirements"],
				currentStepIndex: 0,
			};
			vi.mocked(mockStorage.get).mockReturnValue(metadata);

			metadataRepository.incrementStep("task-123");

			expect(mockStorage.save).toHaveBeenCalledWith({
				...metadata,
				completedAt: "2024-01-01T12:00:00.000Z",
				savedAt: "2024-01-01T12:00:00.000Z",
			});
		});

		it("should handle 12-step workflow completion", () => {
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
			const metadata: IStoredMetadata = {
				taskId: "task-123",
				startedAt: "2024-01-01T00:00:00.000Z",
				savedAt: "2024-01-01T00:00:00.000Z",
				executionSteps: fullWorkflowSteps,
				currentStepIndex: 11, // Last step (documentation)
			};
			vi.mocked(mockStorage.get).mockReturnValue(metadata);

			metadataRepository.incrementStep("task-123");

			const savedMetadata = vi.mocked(mockStorage.save).mock.calls[0][0];
			expect(savedMetadata.completedAt).toBe("2024-01-01T12:00:00.000Z");
			expect(savedMetadata.currentStepIndex).toBe(11);
		});

		it("should not modify already completed workflow", () => {
			const metadata: IStoredMetadata = {
				taskId: "task-123",
				startedAt: "2024-01-01T00:00:00.000Z",
				completedAt: "2024-01-01T01:00:00.000Z",
				savedAt: "2024-01-01T01:00:00.000Z",
				executionSteps: ["requirements", "plan", "implementation"],
				currentStepIndex: 2,
			};
			vi.mocked(mockStorage.get).mockReturnValue(metadata);

			metadataRepository.incrementStep("task-123");

			// Should still save (to update savedAt), but preserve the original completedAt
			const savedMetadata = vi.mocked(mockStorage.save).mock.calls[0][0];
			expect(savedMetadata.completedAt).toBe("2024-01-01T12:00:00.000Z");
		});
	});

	describe("Edge Cases", () => {
		it("should do nothing when metadata not found", () => {
			vi.mocked(mockStorage.get).mockReturnValue(undefined);

			metadataRepository.incrementStep("nonexistent");

			expect(mockStorage.save).not.toHaveBeenCalled();
		});
	});
});
