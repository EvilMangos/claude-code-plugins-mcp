import { describe, expect, it, vi } from "vitest";
import type { ReportType } from "../../types/report.type";
import { MetadataService } from "../metadata.service";
import { createMockMetadataRepository } from "../repository/__mocks__/metadata.repository.mock";

describe("MetadataService.createMetadata", () => {
	describe.concurrent("Basic Functionality", () => {
		it.concurrent(
			"should return success when valid input is provided",
			async () => {
				const mockRepository = createMockMetadataRepository();
				const metadataService = new MetadataService(mockRepository);

				const result = await metadataService.createMetadata({
					taskId: "task-123",
					executionSteps: ["requirements", "plan", "implementation"],
				});

				expect(result).toEqual({ success: true });
			}
		);

		it.concurrent(
			"should call repository.create with correct arguments",
			async () => {
				const mockRepository = createMockMetadataRepository();
				const metadataService = new MetadataService(mockRepository);
				const taskId = "task-456";
				const executionSteps: (ReportType | ReportType[])[] = [
					"requirements",
					"plan",
					"implementation",
				];

				await metadataService.createMetadata({ taskId, executionSteps });

				expect(mockRepository.create).toHaveBeenCalledWith(
					taskId,
					executionSteps
				);
			}
		);

		it.concurrent("should call repository.create exactly once", async () => {
			const mockRepository = createMockMetadataRepository();
			const metadataService = new MetadataService(mockRepository);

			await metadataService.createMetadata({
				taskId: "task-789",
				executionSteps: ["requirements"],
			});

			expect(mockRepository.create).toHaveBeenCalledTimes(1);
		});
	});

	describe.concurrent("taskId Validation", () => {
		it.concurrent("should return error when taskId is missing", async () => {
			const mockRepository = createMockMetadataRepository();
			const metadataService = new MetadataService(mockRepository);

			const result = await metadataService.createMetadata({
				executionSteps: ["requirements"],
			} as never);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});

		it.concurrent(
			"should return error when taskId is empty string",
			async () => {
				const mockRepository = createMockMetadataRepository();
				const metadataService = new MetadataService(mockRepository);

				const result = await metadataService.createMetadata({
					taskId: "",
					executionSteps: ["requirements"],
				});

				expect(result.success).toBe(false);
				expect(result.error).toContain("taskId");
			}
		);

		it.concurrent(
			"should return error when taskId is whitespace only",
			async () => {
				const mockRepository = createMockMetadataRepository();
				const metadataService = new MetadataService(mockRepository);

				const result = await metadataService.createMetadata({
					taskId: "   ",
					executionSteps: ["requirements"],
				});

				expect(result.success).toBe(false);
				expect(result.error).toContain("taskId");
			}
		);

		it.concurrent(
			"should not call repository when taskId validation fails",
			async () => {
				const mockRepository = createMockMetadataRepository();
				const metadataService = new MetadataService(mockRepository);

				await metadataService.createMetadata({
					taskId: "",
					executionSteps: ["requirements"],
				});

				expect(mockRepository.create).not.toHaveBeenCalled();
			}
		);
	});

	describe.concurrent("executionSteps Validation", () => {
		it.concurrent(
			"should return error when executionSteps is missing",
			async () => {
				const mockRepository = createMockMetadataRepository();
				const metadataService = new MetadataService(mockRepository);

				const result = await metadataService.createMetadata({
					taskId: "task-123",
				} as never);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);

		it.concurrent(
			"should return error when executionSteps is empty array",
			async () => {
				const mockRepository = createMockMetadataRepository();
				const metadataService = new MetadataService(mockRepository);

				const result = await metadataService.createMetadata({
					taskId: "task-123",
					executionSteps: [],
				});

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);

		it.concurrent(
			"should return error when executionSteps contains invalid step type",
			async () => {
				const mockRepository = createMockMetadataRepository();
				const metadataService = new MetadataService(mockRepository);

				const result = await metadataService.createMetadata({
					taskId: "task-123",
					executionSteps: ["invalid-step"] as never,
				});

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);

		it.concurrent(
			"should return error when executionSteps contains mixed valid and invalid types",
			async () => {
				const mockRepository = createMockMetadataRepository();
				const metadataService = new MetadataService(mockRepository);

				const result = await metadataService.createMetadata({
					taskId: "task-123",
					executionSteps: ["requirements", "not-a-step", "plan"] as never,
				});

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);

		it.concurrent(
			"should not call repository when executionSteps validation fails",
			async () => {
				const mockRepository = createMockMetadataRepository();
				const metadataService = new MetadataService(mockRepository);

				await metadataService.createMetadata({
					taskId: "task-123",
					executionSteps: [],
				});

				expect(mockRepository.create).not.toHaveBeenCalled();
			}
		);
	});

	describe.concurrent("Parallel Steps Support", () => {
		it.concurrent(
			"should accept nested arrays for parallel step groups",
			async () => {
				const mockRepository = createMockMetadataRepository();
				const metadataService = new MetadataService(mockRepository);

				const result = await metadataService.createMetadata({
					taskId: "task-parallel",
					executionSteps: ["plan", ["performance", "security"], "refactoring"],
				});

				expect(result).toEqual({ success: true });
			}
		);

		it.concurrent(
			"should call repository.create with parallel steps array intact",
			async () => {
				const mockRepository = createMockMetadataRepository();
				const metadataService = new MetadataService(mockRepository);
				const taskId = "task-parallel-2";
				const executionSteps: (ReportType | ReportType[])[] = [
					"requirements",
					["performance", "security"],
					"documentation",
				];

				await metadataService.createMetadata({ taskId, executionSteps });

				expect(mockRepository.create).toHaveBeenCalledWith(
					taskId,
					executionSteps
				);
			}
		);

		it.concurrent("should accept multiple parallel step groups", async () => {
			const mockRepository = createMockMetadataRepository();
			const metadataService = new MetadataService(mockRepository);

			const result = await metadataService.createMetadata({
				taskId: "task-multi-parallel",
				executionSteps: [
					"requirements",
					["tests-design", "tests-review"],
					"implementation",
					["performance", "security"],
					"documentation",
				],
			});

			expect(result).toEqual({ success: true });
		});

		it.concurrent(
			"should return error when parallel group has only one step",
			async () => {
				const mockRepository = createMockMetadataRepository();
				const metadataService = new MetadataService(mockRepository);

				const result = await metadataService.createMetadata({
					taskId: "task-single-parallel",
					executionSteps: ["plan", ["performance"], "refactoring"] as never,
				});

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);

		it.concurrent(
			"should return error when parallel group contains invalid step",
			async () => {
				const mockRepository = createMockMetadataRepository();
				const metadataService = new MetadataService(mockRepository);

				const result = await metadataService.createMetadata({
					taskId: "task-invalid-parallel",
					executionSteps: [
						"plan",
						["performance", "invalid-step"],
						"refactoring",
					] as never,
				});

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);
	});

	describe.concurrent("Error Handling", () => {
		it.concurrent("should return error when repository throws", async () => {
			const mockRepository = createMockMetadataRepository();
			const metadataService = new MetadataService(mockRepository);
			vi.mocked(mockRepository.create).mockImplementation(() => {
				throw new Error("Database connection failed");
			});

			const result = await metadataService.createMetadata({
				taskId: "task-error",
				executionSteps: ["requirements", "plan"],
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain("Database connection failed");
		});

		it.concurrent(
			"should handle non-Error exceptions from repository",
			async () => {
				const mockRepository = createMockMetadataRepository();
				const metadataService = new MetadataService(mockRepository);
				vi.mocked(mockRepository.create).mockImplementation(() => {
					throw "String error";
				});

				const result = await metadataService.createMetadata({
					taskId: "task-string-error",
					executionSteps: ["requirements"],
				});

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);
	});

	describe.concurrent("Full 12-Step Workflow", () => {
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

		it.concurrent("should accept all 12 valid workflow steps", async () => {
			const mockRepository = createMockMetadataRepository();
			const metadataService = new MetadataService(mockRepository);

			const result = await metadataService.createMetadata({
				taskId: "full-workflow",
				executionSteps: fullWorkflowSteps,
			});

			expect(result).toEqual({ success: true });
		});

		it.concurrent("should pass all 12 steps to repository", async () => {
			const mockRepository = createMockMetadataRepository();
			const metadataService = new MetadataService(mockRepository);
			const taskId = "full-workflow-verify";

			await metadataService.createMetadata({
				taskId,
				executionSteps: fullWorkflowSteps,
			});

			expect(mockRepository.create).toHaveBeenCalledWith(
				taskId,
				fullWorkflowSteps
			);
		});
	});
});
