import { describe, expect, it, vi } from "vitest";
import { ReportType } from "../../types/report.type";
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
					executionSteps: [
						ReportType.REQUIREMENTS,
						ReportType.PLAN,
						ReportType.IMPLEMENTATION,
					],
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
					ReportType.REQUIREMENTS,
					ReportType.PLAN,
					ReportType.IMPLEMENTATION,
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
				executionSteps: [ReportType.REQUIREMENTS],
			});

			expect(mockRepository.create).toHaveBeenCalledTimes(1);
		});
	});

	describe.concurrent("taskId Validation", () => {
		it.concurrent("should return error when taskId is missing", async () => {
			const mockRepository = createMockMetadataRepository();
			const metadataService = new MetadataService(mockRepository);

			const result = await metadataService.createMetadata({
				executionSteps: [ReportType.REQUIREMENTS],
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
					executionSteps: [ReportType.REQUIREMENTS],
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
					executionSteps: [ReportType.REQUIREMENTS],
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
					executionSteps: [ReportType.REQUIREMENTS],
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
					executionSteps: [
						ReportType.REQUIREMENTS,
						"not-a-step",
						ReportType.PLAN,
					] as never,
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
					executionSteps: [
						ReportType.PLAN,
						[ReportType.PERFORMANCE, ReportType.SECURITY],
						ReportType.REFACTORING,
					],
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
					ReportType.REQUIREMENTS,
					[ReportType.PERFORMANCE, ReportType.SECURITY],
					ReportType.DOCUMENTATION,
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
					ReportType.REQUIREMENTS,
					[ReportType.TESTS_DESIGN, ReportType.TESTS_REVIEW],
					ReportType.IMPLEMENTATION,
					[ReportType.PERFORMANCE, ReportType.SECURITY],
					ReportType.DOCUMENTATION,
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
					executionSteps: [
						ReportType.PLAN,
						[ReportType.PERFORMANCE],
						ReportType.REFACTORING,
					] as never,
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
						ReportType.PLAN,
						[ReportType.PERFORMANCE, "invalid-step"],
						ReportType.REFACTORING,
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
				executionSteps: [ReportType.REQUIREMENTS, ReportType.PLAN],
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
					executionSteps: [ReportType.REQUIREMENTS],
				});

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);
	});

	describe.concurrent("Full 12-Step Workflow", () => {
		const fullWorkflowSteps = [
			ReportType.REQUIREMENTS,
			ReportType.PLAN,
			ReportType.TESTS_DESIGN,
			ReportType.TESTS_REVIEW,
			ReportType.IMPLEMENTATION,
			ReportType.STABILIZATION,
			ReportType.ACCEPTANCE,
			ReportType.PERFORMANCE,
			ReportType.SECURITY,
			ReportType.REFACTORING,
			ReportType.CODE_REVIEW,
			ReportType.DOCUMENTATION,
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
