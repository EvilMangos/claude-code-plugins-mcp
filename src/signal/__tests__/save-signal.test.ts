import { beforeEach, describe, expect, it, vi } from "vitest";
import { REPORT_TYPES, ReportType } from "../../types/report.type";
import { SaveSignalInput } from "../schemas/save-signal.schema";
import { SignalService } from "../signal.service";
import { SignalStatus } from "../types/signal-status.type";
import { createMockSignalRepository } from "../repository/__mocks__/signal.repository.mock";
import { createMockMetadataRepository } from "../../metadata/repository/__mocks__/metadata.repository.mock";

/**
 * Test-only type that allows any string for signalType to test validation.
 */
type TestSaveSignalInput = Omit<SaveSignalInput, "signalType" | "content"> & {
	signalType: string;
	content: {
		status: string;
		summary: string;
	};
};

// Create mock repositories
const mockRepository = createMockSignalRepository();
const mockMetadataRepository = createMockMetadataRepository();

// Create service with mock repositories
const signalService = new SignalService(mockRepository, mockMetadataRepository);

describe("SignalService.saveSignal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Save Signal", () => {
		it.concurrent(
			"should save a signal with valid inputs and return success",
			async () => {
				const input: SaveSignalInput = {
					taskId: "develop-feature-auth-123",
					signalType: ReportType.REQUIREMENTS,
					content: {
						status: SignalStatus.PASSED,
						summary: "All requirements validated successfully",
					},
				};

				const result = await signalService.saveSignal(input);

				expect(result).toEqual({ success: true });
			}
		);

		it.concurrent(
			"should call repository.save with taskId, signalType, and content",
			async () => {
				const input: SaveSignalInput = {
					taskId: "develop-feature-auth-123",
					signalType: ReportType.IMPLEMENTATION,
					content: {
						status: SignalStatus.FAILED,
						summary: "Implementation has failing tests",
					},
				};

				await signalService.saveSignal(input);

				expect(mockRepository.save).toHaveBeenCalledWith(
					"develop-feature-auth-123",
					ReportType.IMPLEMENTATION,
					{
						status: SignalStatus.FAILED,
						summary: "Implementation has failing tests",
					}
				);
			}
		);

		it.concurrent(
			"should not pass timestamp to repository (timestamp is repository responsibility)",
			async () => {
				const input: SaveSignalInput = {
					taskId: "task-id-1",
					signalType: ReportType.PLAN,
					content: {
						status: SignalStatus.PASSED,
						summary: "Plan approved",
					},
				};

				await signalService.saveSignal(input);

				expect(mockRepository.save).toHaveBeenCalledWith(
					"task-id-1",
					ReportType.PLAN,
					{
						status: SignalStatus.PASSED,
						summary: "Plan approved",
					}
				);
				const matchingCall = vi
					.mocked(mockRepository.save)
					.mock.calls.find(
						(call) =>
							call[0] === "task-id-1" &&
							call[1] === ReportType.PLAN &&
							call[2].status === SignalStatus.PASSED
					);
				expect(matchingCall).toBeDefined();
				expect(matchingCall).toHaveLength(3);
			}
		);
	});

	describe("Input Validation", () => {
		describe("taskId validation", () => {
			it.concurrent("should return error when taskId is missing", async () => {
				const input = {
					signalType: ReportType.REQUIREMENTS,
					content: { status: SignalStatus.PASSED, summary: "ok" },
				} as SaveSignalInput;

				const result = await signalService.saveSignal(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("taskId"),
				});
			});

			it.concurrent(
				"should return error when taskId is empty string",
				async () => {
					const input: SaveSignalInput = {
						taskId: "",
						signalType: ReportType.REQUIREMENTS,
						content: { status: SignalStatus.PASSED, summary: "ok" },
					};

					const result = await signalService.saveSignal(input);

					expect(result).toEqual({
						success: false,
						error: expect.stringContaining("taskId"),
					});
				}
			);

			it.concurrent(
				"should return error when taskId is whitespace only",
				async () => {
					const input: SaveSignalInput = {
						taskId: "   ",
						signalType: ReportType.REQUIREMENTS,
						content: { status: SignalStatus.PASSED, summary: "ok" },
					};

					const result = await signalService.saveSignal(input);

					expect(result).toEqual({
						success: false,
						error: expect.stringContaining("taskId"),
					});
				}
			);
		});

		describe("signalType validation", () => {
			it.concurrent(
				"should return error when signalType is missing",
				async () => {
					const input = {
						taskId: "task-123",
						content: { status: SignalStatus.PASSED, summary: "ok" },
					} as SaveSignalInput;

					const result = await signalService.saveSignal(input);

					expect(result).toEqual({
						success: false,
						error: expect.stringContaining("signalType"),
					});
				}
			);

			it.concurrent(
				"should return error when signalType is empty string",
				async () => {
					const input: TestSaveSignalInput = {
						taskId: "task-123",
						signalType: "",
						content: { status: SignalStatus.PASSED, summary: "ok" },
					};

					const result = await signalService.saveSignal(
						input as SaveSignalInput
					);

					expect(result).toEqual({
						success: false,
						error: expect.stringContaining("signalType"),
					});
				}
			);

			it.concurrent(
				"should return error when signalType is invalid",
				async () => {
					const input: TestSaveSignalInput = {
						taskId: "task-123",
						signalType: "invalid-type",
						content: { status: SignalStatus.PASSED, summary: "ok" },
					};

					const result = await signalService.saveSignal(
						input as SaveSignalInput
					);

					expect(result).toEqual({
						success: false,
						error: expect.stringContaining("signalType"),
					});
				}
			);
		});

		describe("content validation", () => {
			it.concurrent("should return error when content is missing", async () => {
				const input = {
					taskId: "task-123",
					signalType: ReportType.REQUIREMENTS,
				} as SaveSignalInput;

				const result = await signalService.saveSignal(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("content"),
				});
			});

			it.concurrent(
				"should return error when content.status is missing",
				async () => {
					const input = {
						taskId: "task-123",
						signalType: ReportType.REQUIREMENTS,
						content: { summary: "ok" },
					} as SaveSignalInput;

					const result = await signalService.saveSignal(input);

					expect(result).toEqual({
						success: false,
						error: expect.stringContaining("status"),
					});
				}
			);

			it.concurrent(
				"should return error when content.summary is missing",
				async () => {
					const input = {
						taskId: "task-123",
						signalType: ReportType.REQUIREMENTS,
						content: { status: SignalStatus.PASSED },
					} as SaveSignalInput;

					const result = await signalService.saveSignal(input);

					expect(result).toEqual({
						success: false,
						error: expect.stringContaining("summary"),
					});
				}
			);

			it.concurrent(
				"should return error when content.status is invalid",
				async () => {
					const input: TestSaveSignalInput = {
						taskId: "task-123",
						signalType: ReportType.REQUIREMENTS,
						content: { status: "unknown", summary: "ok" },
					};

					const result = await signalService.saveSignal(
						input as SaveSignalInput
					);

					expect(result).toEqual({
						success: false,
						error: expect.stringContaining("status"),
					});
				}
			);

			it.concurrent("should accept empty string summary", async () => {
				const input: SaveSignalInput = {
					taskId: "task-123",
					signalType: ReportType.IMPLEMENTATION,
					content: { status: SignalStatus.PASSED, summary: "" },
				};

				const result = await signalService.saveSignal(input);

				expect(result).toEqual({ success: true });
			});
		});

		describe("multiple validation errors", () => {
			it.concurrent(
				"should return error when multiple fields are missing",
				async () => {
					const input = {
						content: { status: SignalStatus.PASSED, summary: "ok" },
					} as SaveSignalInput;

					const result = await signalService.saveSignal(input);

					expect(result.success).toBe(false);
					expect(result.error).toBeDefined();
				}
			);
		});
	});

	describe("Overwrite Behavior", () => {
		it.concurrent(
			"should overwrite existing signal with same key",
			async () => {
				const input: SaveSignalInput = {
					taskId: "task-123",
					signalType: ReportType.REQUIREMENTS,
					content: { status: SignalStatus.PASSED, summary: "Updated summary" },
				};

				const result = await signalService.saveSignal(input);

				expect(result).toEqual({ success: true });
				expect(mockRepository.save).toHaveBeenCalledWith(
					"task-123",
					ReportType.REQUIREMENTS,
					{ status: SignalStatus.PASSED, summary: "Updated summary" }
				);
			}
		);

		it.concurrent("should not affect signals with different keys", async () => {
			const input1: SaveSignalInput = {
				taskId: "task-different-keys-1",
				signalType: ReportType.REQUIREMENTS,
				content: { status: SignalStatus.PASSED, summary: "Requirements ok" },
			};
			const input2: SaveSignalInput = {
				taskId: "task-different-keys-1",
				signalType: ReportType.IMPLEMENTATION,
				content: {
					status: SignalStatus.FAILED,
					summary: "Implementation failed",
				},
			};

			await signalService.saveSignal(input1);
			await signalService.saveSignal(input2);

			expect(mockRepository.save).toHaveBeenCalledWith(
				"task-different-keys-1",
				ReportType.REQUIREMENTS,
				{ status: SignalStatus.PASSED, summary: "Requirements ok" }
			);
			expect(mockRepository.save).toHaveBeenCalledWith(
				"task-different-keys-1",
				ReportType.IMPLEMENTATION,
				{ status: SignalStatus.FAILED, summary: "Implementation failed" }
			);
		});
	});

	describe("Accept Only Valid Signal Types", () => {
		it.concurrent("should accept all valid signal types", async () => {
			const inputs: SaveSignalInput[] = REPORT_TYPES.map((signalType) => ({
				taskId: "task-123",
				signalType,
				content: {
					status: SignalStatus.PASSED as SignalStatus,
					summary: `${signalType} passed`,
				},
			}));

			const results = await Promise.all(
				inputs.map((input) => signalService.saveSignal(input))
			);

			results.forEach((result) => {
				expect(result).toEqual({ success: true });
			});
		});

		it.concurrent(
			"should reject custom signal types not in the enum",
			async () => {
				const invalidTypes = [
					"custom-signal",
					"my-special-type",
					"experimental-phase",
				];

				const results = await Promise.all(
					invalidTypes.map((signalType) =>
						signalService.saveSignal({
							taskId: "task-123",
							signalType,
							content: { status: SignalStatus.PASSED, summary: "ok" },
						} as SaveSignalInput)
					)
				);

				results.forEach((result) => {
					expect(result.success).toBe(false);
					expect(result.error).toBeDefined();
					expect(result.error).toMatch(/signalType/i);
				});
			}
		);
	});

	describe("Accept Only Valid Status Values", () => {
		it.concurrent("should accept 'passed' status", async () => {
			const input: SaveSignalInput = {
				taskId: "task-123",
				signalType: ReportType.REQUIREMENTS,
				content: { status: SignalStatus.PASSED, summary: "ok" },
			};

			const result = await signalService.saveSignal(input);

			expect(result).toEqual({ success: true });
		});

		it.concurrent("should accept 'failed' status", async () => {
			const input: SaveSignalInput = {
				taskId: "task-123",
				signalType: ReportType.REQUIREMENTS,
				content: { status: SignalStatus.FAILED, summary: "not ok" },
			};

			const result = await signalService.saveSignal(input);

			expect(result).toEqual({ success: true });
		});

		it.concurrent("should reject invalid status values", async () => {
			const invalidStatuses = [
				"success",
				"failure",
				"pending",
				"blocked",
				"unknown",
			];

			const results = await Promise.all(
				invalidStatuses.map((status) =>
					signalService.saveSignal({
						taskId: "task-123",
						signalType: ReportType.REQUIREMENTS,
						content: { status, summary: "ok" },
					} as SaveSignalInput)
				)
			);

			results.forEach((result) => {
				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});
		});
	});

	describe("Error Handling", () => {
		it.concurrent(
			"should return error structure with success false and error message",
			async () => {
				const input: SaveSignalInput = {
					taskId: "",
					signalType: ReportType.REQUIREMENTS,
					content: { status: SignalStatus.PASSED, summary: "ok" },
				};

				const result = await signalService.saveSignal(input);

				expect(result).toHaveProperty("success", false);
				expect(result).toHaveProperty("error");
				expect(typeof result.error).toBe("string");
			}
		);

		it.concurrent("should handle repository errors gracefully", async () => {
			vi.mocked(mockRepository.save).mockImplementationOnce(() => {
				throw new Error("Storage failure");
			});

			const input: SaveSignalInput = {
				taskId: "task-123",
				signalType: ReportType.REQUIREMENTS,
				content: { status: SignalStatus.PASSED, summary: "ok" },
			};

			const result = await signalService.saveSignal(input);

			expect(result).toEqual({
				success: false,
				error: expect.stringContaining("Storage failure"),
			});
		});
	});

	describe("Edge Cases", () => {
		it.concurrent("should handle very long summary", async () => {
			const longSummary = "x".repeat(10000);
			const input: SaveSignalInput = {
				taskId: "task-123",
				signalType: ReportType.REQUIREMENTS,
				content: { status: SignalStatus.PASSED, summary: longSummary },
			};

			const result = await signalService.saveSignal(input);

			expect(result).toEqual({ success: true });
		});

		it.concurrent("should handle summary with special characters", async () => {
			const input: SaveSignalInput = {
				taskId: "task-123",
				signalType: ReportType.REQUIREMENTS,
				content: {
					status: SignalStatus.PASSED,
					summary: "Summary with unicode: \u0000 and emojis: \uD83D\uDE00",
				},
			};

			const result = await signalService.saveSignal(input);

			expect(result).toEqual({ success: true });
		});

		it.concurrent("should handle concurrent save calls", async () => {
			const inputs: SaveSignalInput[] = [
				{
					taskId: "task-concurrent-1",
					signalType: ReportType.REQUIREMENTS,
					content: { status: SignalStatus.PASSED, summary: "s1" },
				},
				{
					taskId: "task-concurrent-2",
					signalType: ReportType.PLAN,
					content: { status: SignalStatus.FAILED, summary: "s2" },
				},
				{
					taskId: "task-concurrent-3",
					signalType: ReportType.IMPLEMENTATION,
					content: { status: SignalStatus.PASSED, summary: "s3" },
				},
			];

			const results = await Promise.all(
				inputs.map((input) => signalService.saveSignal(input))
			);

			expect(results).toEqual([
				{ success: true },
				{ success: true },
				{ success: true },
			]);

			expect(mockRepository.save).toHaveBeenCalledWith(
				"task-concurrent-1",
				ReportType.REQUIREMENTS,
				{ status: SignalStatus.PASSED, summary: "s1" }
			);
			expect(mockRepository.save).toHaveBeenCalledWith(
				"task-concurrent-2",
				ReportType.PLAN,
				{ status: SignalStatus.FAILED, summary: "s2" }
			);
			expect(mockRepository.save).toHaveBeenCalledWith(
				"task-concurrent-3",
				ReportType.IMPLEMENTATION,
				{ status: SignalStatus.PASSED, summary: "s3" }
			);
		});
	});
});
