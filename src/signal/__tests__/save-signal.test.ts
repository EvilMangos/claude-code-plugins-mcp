import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IMetadataRepository } from "../../metadata/types/metadata-repository.interface";
import { ReportType } from "../../types/report.type";
import { SaveSignalInput } from "../schemas/save-signal.schema";
import { SignalServiceImpl } from "../service";
import type { ISignalRepository } from "../types/signal-repository.interface";
import { SIGNAL_STATUSES, SignalStatus } from "../types/signal-status.type";

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

// Create mock repository
const mockRepository: ISignalRepository = {
	save: vi.fn(),
	get: vi.fn(),
	clear: vi.fn(),
};

// Create mock metadata repository
const mockMetadataRepository: IMetadataRepository = {
	create: vi.fn(),
	get: vi.fn(),
	exists: vi.fn(),
	incrementStep: vi.fn(),
	decrementStep: vi.fn(),
	clear: vi.fn(),
};

// Create service with mock repositories
const signalService = new SignalServiceImpl(
	mockRepository,
	mockMetadataRepository
);

describe("SignalService.saveSignal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Save Signal", () => {
		it.concurrent(
			"should save a signal with valid inputs and return success",
			async () => {
				const input: SaveSignalInput = {
					taskId: "develop-feature-auth-123",
					signalType: "requirements",
					content: {
						status: "passed",
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
					signalType: "implementation",
					content: {
						status: "failed",
						summary: "Implementation has failing tests",
					},
				};

				await signalService.saveSignal(input);

				expect(mockRepository.save).toHaveBeenCalledWith(
					"develop-feature-auth-123",
					"implementation",
					{
						status: "failed",
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
					signalType: "plan",
					content: {
						status: "passed",
						summary: "Plan approved",
					},
				};

				await signalService.saveSignal(input);

				expect(mockRepository.save).toHaveBeenCalledWith("task-id-1", "plan", {
					status: "passed",
					summary: "Plan approved",
				});
				const matchingCall = vi
					.mocked(mockRepository.save)
					.mock.calls.find(
						(call) =>
							call[0] === "task-id-1" &&
							call[1] === "plan" &&
							call[2].status === "passed"
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
					signalType: "requirements",
					content: { status: "passed", summary: "ok" },
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
						signalType: "requirements",
						content: { status: "passed", summary: "ok" },
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
						signalType: "requirements",
						content: { status: "passed", summary: "ok" },
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
						content: { status: "passed", summary: "ok" },
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
						content: { status: "passed", summary: "ok" },
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
						content: { status: "passed", summary: "ok" },
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
					signalType: "requirements",
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
						signalType: "requirements",
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
						signalType: "requirements",
						content: { status: "passed" },
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
						signalType: "requirements",
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
					signalType: "implementation",
					content: { status: "passed", summary: "" },
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
						content: { status: "passed", summary: "ok" },
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
					signalType: "requirements",
					content: { status: "passed", summary: "Updated summary" },
				};

				const result = await signalService.saveSignal(input);

				expect(result).toEqual({ success: true });
				expect(mockRepository.save).toHaveBeenCalledWith(
					"task-123",
					"requirements",
					{ status: "passed", summary: "Updated summary" }
				);
			}
		);

		it.concurrent("should not affect signals with different keys", async () => {
			const input1: SaveSignalInput = {
				taskId: "task-different-keys-1",
				signalType: "requirements",
				content: { status: "passed", summary: "Requirements ok" },
			};
			const input2: SaveSignalInput = {
				taskId: "task-different-keys-1",
				signalType: "implementation",
				content: { status: "failed", summary: "Implementation failed" },
			};

			await signalService.saveSignal(input1);
			await signalService.saveSignal(input2);

			expect(mockRepository.save).toHaveBeenCalledWith(
				"task-different-keys-1",
				"requirements",
				{ status: "passed", summary: "Requirements ok" }
			);
			expect(mockRepository.save).toHaveBeenCalledWith(
				"task-different-keys-1",
				"implementation",
				{ status: "failed", summary: "Implementation failed" }
			);
		});
	});

	describe("Accept Only Valid Signal Types", () => {
		it.concurrent("should accept all 12 valid signal types", async () => {
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

			const inputs: SaveSignalInput[] = validTypes.map((signalType) => ({
				taskId: "task-123",
				signalType,
				content: {
					status: "passed" as SignalStatus,
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
							content: { status: "passed", summary: "ok" },
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
				signalType: "requirements",
				content: { status: "passed", summary: "ok" },
			};

			const result = await signalService.saveSignal(input);

			expect(result).toEqual({ success: true });
		});

		it.concurrent("should accept 'failed' status", async () => {
			const input: SaveSignalInput = {
				taskId: "task-123",
				signalType: "requirements",
				content: { status: "failed", summary: "not ok" },
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
						signalType: "requirements",
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

	describe("Export SIGNAL_STATUSES and SignalStatus", () => {
		it.concurrent(
			"should export SIGNAL_STATUSES constant with 2 values",
			() => {
				expect(SIGNAL_STATUSES).toBeDefined();
				expect(Array.isArray(SIGNAL_STATUSES)).toBe(true);
				expect(SIGNAL_STATUSES).toHaveLength(2);
			}
		);

		it.concurrent(
			"should export SIGNAL_STATUSES containing passed and failed",
			() => {
				expect(SIGNAL_STATUSES).toContain("passed");
				expect(SIGNAL_STATUSES).toContain("failed");
			}
		);

		it.concurrent(
			"should export SignalStatus type (compile-time verification)",
			() => {
				const validStatus: SignalStatus = "passed";
				expect(validStatus).toBe("passed");

				const statuses: SignalStatus[] = ["passed", "failed"];
				expect(statuses).toHaveLength(2);
			}
		);
	});

	describe("Error Handling", () => {
		it.concurrent(
			"should return error structure with success false and error message",
			async () => {
				const input: SaveSignalInput = {
					taskId: "",
					signalType: "requirements",
					content: { status: "passed", summary: "ok" },
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
				signalType: "requirements",
				content: { status: "passed", summary: "ok" },
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
				signalType: "requirements",
				content: { status: "passed", summary: longSummary },
			};

			const result = await signalService.saveSignal(input);

			expect(result).toEqual({ success: true });
		});

		it.concurrent("should handle summary with special characters", async () => {
			const input: SaveSignalInput = {
				taskId: "task-123",
				signalType: "requirements",
				content: {
					status: "passed",
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
					signalType: "requirements",
					content: { status: "passed", summary: "s1" },
				},
				{
					taskId: "task-concurrent-2",
					signalType: "plan",
					content: { status: "failed", summary: "s2" },
				},
				{
					taskId: "task-concurrent-3",
					signalType: "implementation",
					content: { status: "passed", summary: "s3" },
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
				"requirements",
				{ status: "passed", summary: "s1" }
			);
			expect(mockRepository.save).toHaveBeenCalledWith(
				"task-concurrent-2",
				"plan",
				{ status: "failed", summary: "s2" }
			);
			expect(mockRepository.save).toHaveBeenCalledWith(
				"task-concurrent-3",
				"implementation",
				{ status: "passed", summary: "s3" }
			);
		});
	});
});
