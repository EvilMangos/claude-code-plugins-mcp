import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignalServiceImpl } from "../service";
import type { ISignalRepository } from "../types/signal-repository.interface";
import { ReportType } from "../../types/report.type";
import { GetSignalInput } from "../schemas/get-signal.schema";
import type { IStoredSignal } from "../types/stored-signal.interface";

/**
 * Test-only type that allows any string for signalType to test validation.
 */
type TestGetSignalInput = Omit<GetSignalInput, "signalType"> & {
	signalType: string;
};

// Create mock repository
const mockRepository: ISignalRepository = {
	save: vi.fn(),
	get: vi.fn(),
	clear: vi.fn(),
};

// Create service with mock repository
const signalService = new SignalServiceImpl(mockRepository);

describe("SignalService.getSignal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Validate taskId Input", () => {
		it.concurrent("should return error when taskId is missing", async () => {
			const input = {
				signalType: "requirements",
			} as GetSignalInput;

			const result = await signalService.getSignal(input);

			expect(result).toEqual({
				success: false,
				error: expect.stringContaining("taskId"),
			});
		});

		it.concurrent(
			"should return error when taskId is empty string",
			async () => {
				const input: GetSignalInput = {
					taskId: "",
					signalType: "requirements",
				};

				const result = await signalService.getSignal(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("taskId"),
				});
			}
		);

		it.concurrent(
			"should return error when taskId is whitespace only",
			async () => {
				const input: GetSignalInput = {
					taskId: "   ",
					signalType: "requirements",
				};

				const result = await signalService.getSignal(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("taskId"),
				});
			}
		);

		it.concurrent(
			"should accept valid taskId and proceed to repository lookup",
			async () => {
				vi.mocked(mockRepository.get).mockReturnValueOnce(undefined);

				const input: GetSignalInput = {
					taskId: "valid-task-id",
					signalType: "requirements",
				};

				const result = await signalService.getSignal(input);

				expect(result.success).toBe(true);
				expect(mockRepository.get).toHaveBeenCalled();
			}
		);
	});

	describe("Validate signalType Input", () => {
		it.concurrent(
			"should return error when signalType is missing",
			async () => {
				const input = {
					taskId: "task-123",
				} as GetSignalInput;

				const result = await signalService.getSignal(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("signalType"),
				});
			}
		);

		it.concurrent(
			"should return error when signalType is empty string",
			async () => {
				const input: TestGetSignalInput = {
					taskId: "task-123",
					signalType: "",
				};

				const result = await signalService.getSignal(input as GetSignalInput);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("signalType"),
				});
			}
		);

		it.concurrent(
			"should return error when signalType is not in REPORT_TYPES",
			async () => {
				const invalidTypes = [
					"invalid-type",
					"custom-signal",
					"my-special-type",
					"123-numeric-prefix",
				];

				const results = await Promise.all(
					invalidTypes.map((signalType) =>
						signalService.getSignal({
							taskId: "task-123",
							signalType,
						} as GetSignalInput)
					)
				);

				results.forEach((result) => {
					expect(result.success).toBe(false);
					expect(result.error).toBeDefined();
					expect(result.error).toMatch(/signalType/i);
				});
			}
		);

		it.concurrent("should accept all 12 valid signal types", async () => {
			vi.mocked(mockRepository.get).mockReturnValue(undefined);

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

			const inputs: GetSignalInput[] = validTypes.map((signalType) => ({
				taskId: "task-123",
				signalType,
			}));

			const results = await Promise.all(
				inputs.map((input) => signalService.getSignal(input))
			);

			results.forEach((result) => {
				expect(result.success).toBe(true);
			});
		});

		it.concurrent(
			"should reject uppercase variants of valid types (case-sensitive)",
			async () => {
				const uppercaseVariants = [
					"REQUIREMENTS",
					"Requirements",
					"PLAN",
					"Plan",
					"IMPLEMENTATION",
					"Implementation",
				];

				const results = await Promise.all(
					uppercaseVariants.map((signalType) =>
						signalService.getSignal({
							taskId: "task-123",
							signalType,
						} as GetSignalInput)
					)
				);

				results.forEach((result) => {
					expect(result.success).toBe(false);
					expect(result.error).toBeDefined();
				});
			}
		);
	});

	describe("Retrieve Existing Signal from Repository", () => {
		it.concurrent(
			"should return success with content when signal exists",
			async () => {
				const storedSignal: IStoredSignal = {
					taskId: "develop-feature-auth-123",
					signalType: "requirements",
					content: {
						status: "passed",
						summary: "All requirements validated successfully",
					},
					savedAt: "2025-01-15T10:30:00.000Z",
				};

				vi.mocked(mockRepository.get).mockReturnValueOnce(storedSignal);

				const input: GetSignalInput = {
					taskId: "develop-feature-auth-123",
					signalType: "requirements",
				};

				const result = await signalService.getSignal(input);

				expect(result).toEqual({
					success: true,
					content: storedSignal.content,
				});
			}
		);

		it.concurrent(
			"should return full signal content object (status and summary)",
			async () => {
				const storedSignal: IStoredSignal = {
					taskId: "task-id-1",
					signalType: "plan",
					content: {
						status: "failed",
						summary: "Plan has issues",
					},
					savedAt: "2025-01-15T10:30:00.000Z",
				};

				vi.mocked(mockRepository.get).mockReturnValueOnce(storedSignal);

				const input: GetSignalInput = {
					taskId: "task-id-1",
					signalType: "plan",
				};

				const result = await signalService.getSignal(input);

				expect(result.success).toBe(true);
				expect(result.content).toEqual({
					status: "failed",
					summary: "Plan has issues",
				});
			}
		);

		it.concurrent(
			"should call repository.get with correct taskId and signalType",
			async () => {
				vi.mocked(mockRepository.get).mockReturnValueOnce(undefined);

				const input: GetSignalInput = {
					taskId: "my-task-id",
					signalType: "implementation",
				};

				await signalService.getSignal(input);

				expect(mockRepository.get).toHaveBeenCalledWith(
					"my-task-id",
					"implementation"
				);
			}
		);
	});

	describe("Handle Non-Existent Signal", () => {
		it.concurrent(
			"should return success true with content null when signal not found",
			async () => {
				vi.mocked(mockRepository.get).mockReturnValueOnce(undefined);

				const input: GetSignalInput = {
					taskId: "non-existent-task",
					signalType: "requirements",
				};

				const result = await signalService.getSignal(input);

				expect(result).toEqual({
					success: true,
					content: null,
				});
			}
		);

		it.concurrent(
			"should not return error when signal is not found",
			async () => {
				vi.mocked(mockRepository.get).mockReturnValueOnce(undefined);

				const input: GetSignalInput = {
					taskId: "non-existent-task",
					signalType: "plan",
				};

				const result = await signalService.getSignal(input);

				expect(result.success).toBe(true);
				expect(result.error).toBeUndefined();
			}
		);
	});

	describe("Handle Repository Errors Gracefully", () => {
		it.concurrent(
			"should handle repository exceptions gracefully",
			async () => {
				vi.mocked(mockRepository.get).mockImplementationOnce(() => {
					throw new Error("Storage failure");
				});

				const input: GetSignalInput = {
					taskId: "task-123",
					signalType: "requirements",
				};

				const result = await signalService.getSignal(input);

				expect(result).toEqual({
					success: false,
					error: expect.stringContaining("Storage failure"),
				});
			}
		);

		it.concurrent(
			"should handle non-Error thrown objects gracefully",
			async () => {
				vi.mocked(mockRepository.get).mockImplementationOnce(() => {
					throw "String error";
				});

				const input: GetSignalInput = {
					taskId: "task-123",
					signalType: "requirements",
				};

				const result = await signalService.getSignal(input);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);

		it.concurrent(
			"should return error structure with success false and error message",
			async () => {
				vi.mocked(mockRepository.get).mockImplementationOnce(() => {
					throw new Error("Internal database error");
				});

				const input: GetSignalInput = {
					taskId: "task-123",
					signalType: "requirements",
				};

				const result = await signalService.getSignal(input);

				expect(result).toHaveProperty("success", false);
				expect(result).toHaveProperty("error");
				expect(typeof result.error).toBe("string");
			}
		);
	});

	describe("Edge Cases", () => {
		it.concurrent("should handle concurrent get calls", async () => {
			const storedSignals: IStoredSignal[] = [
				{
					taskId: "task-concurrent-1",
					signalType: "requirements",
					content: { status: "passed", summary: "s1" },
					savedAt: "2025-01-15T10:30:00.000Z",
				},
				{
					taskId: "task-concurrent-2",
					signalType: "plan",
					content: { status: "failed", summary: "s2" },
					savedAt: "2025-01-15T10:31:00.000Z",
				},
				{
					taskId: "task-concurrent-3",
					signalType: "implementation",
					content: { status: "passed", summary: "s3" },
					savedAt: "2025-01-15T10:32:00.000Z",
				},
			];

			vi.mocked(mockRepository.get)
				.mockReturnValueOnce(storedSignals[0])
				.mockReturnValueOnce(storedSignals[1])
				.mockReturnValueOnce(storedSignals[2]);

			const inputs: GetSignalInput[] = [
				{ taskId: "task-concurrent-1", signalType: "requirements" },
				{ taskId: "task-concurrent-2", signalType: "plan" },
				{ taskId: "task-concurrent-3", signalType: "implementation" },
			];

			const results = await Promise.all(
				inputs.map((input) => signalService.getSignal(input))
			);

			expect(results[0]).toEqual({
				success: true,
				content: { status: "passed", summary: "s1" },
			});
			expect(results[1]).toEqual({
				success: true,
				content: { status: "failed", summary: "s2" },
			});
			expect(results[2]).toEqual({
				success: true,
				content: { status: "passed", summary: "s3" },
			});
		});

		it.concurrent("should handle taskId with various formats", async () => {
			vi.mocked(mockRepository.get).mockReturnValue(undefined);

			const taskIds = [
				"develop-feature-auth-123",
				"fix-bug-login-1234567890",
				"simple",
				"with_underscores",
				"123-starting-with-numbers",
			];

			const inputs: GetSignalInput[] = taskIds.map((taskId) => ({
				taskId,
				signalType: "requirements",
			}));

			const results = await Promise.all(
				inputs.map((input) => signalService.getSignal(input))
			);

			results.forEach((result) => {
				expect(result.success).toBe(true);
			});
		});

		it.concurrent(
			"should return signal with special characters in summary unchanged",
			async () => {
				const storedSignal: IStoredSignal = {
					taskId: "task-special",
					signalType: "requirements",
					content: {
						status: "passed",
						summary:
							"Summary with unicode: \u0000\u0001\u0002 and emojis: \uD83D\uDE00\uD83D\uDE01",
					},
					savedAt: "2025-01-15T10:30:00.000Z",
				};

				vi.mocked(mockRepository.get).mockReturnValueOnce(storedSignal);

				const input: GetSignalInput = {
					taskId: "task-special",
					signalType: "requirements",
				};

				const result = await signalService.getSignal(input);

				expect(result.success).toBe(true);
				expect(result.content).toEqual(storedSignal.content);
			}
		);

		it.concurrent(
			"should return signal with very long summary unchanged",
			async () => {
				const longSummary = "x".repeat(10000);
				const storedSignal: IStoredSignal = {
					taskId: "task-long",
					signalType: "requirements",
					content: {
						status: "passed",
						summary: longSummary,
					},
					savedAt: "2025-01-15T10:30:00.000Z",
				};

				vi.mocked(mockRepository.get).mockReturnValueOnce(storedSignal);

				const input: GetSignalInput = {
					taskId: "task-long",
					signalType: "requirements",
				};

				const result = await signalService.getSignal(input);

				expect(result.success).toBe(true);
				expect(result.content?.summary).toBe(longSummary);
				expect(result.content?.summary.length).toBe(10000);
			}
		);
	});

	describe("Multiple Validation Errors", () => {
		it.concurrent(
			"should return error when multiple fields are invalid",
			async () => {
				const input = {} as GetSignalInput;

				const result = await signalService.getSignal(input);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);

		it.concurrent(
			"should return error when both taskId and signalType are invalid",
			async () => {
				const input: TestGetSignalInput = {
					taskId: "",
					signalType: "invalid-type",
				};

				const result = await signalService.getSignal(input as GetSignalInput);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			}
		);
	});
});
