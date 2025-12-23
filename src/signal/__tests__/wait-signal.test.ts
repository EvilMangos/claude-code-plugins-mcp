import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReportType } from "../../types/report.type";
import { SignalService } from "../signal.service";
import type { IStoredSignal } from "../types/stored-signal.interface";
import { createMockSignalRepository } from "../repository/__mocks__/signal.repository.mock";
import { createMockMetadataRepository } from "../../metadata/repository/__mocks__/metadata.repository.mock";

/**
 * Helper to create a stored signal
 */
function createStoredSignal(
	taskId: string,
	signalType: ReportType,
	status: "passed" | "failed",
	summary: string
): IStoredSignal {
	return {
		taskId,
		signalType,
		content: { status, summary },
		savedAt: new Date().toISOString(),
	};
}

describe("SignalService.waitSignal", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("Step Progression", () => {
		it.concurrent(
			"should increment step once when single signal is passed",
			async () => {
				const mockRepository = createMockSignalRepository();
				const mockMetadataRepository = createMockMetadataRepository();
				const signalService = new SignalService(
					mockRepository,
					mockMetadataRepository
				);

				const taskId = "task-123";
				vi.mocked(mockRepository.get).mockReturnValue(
					createStoredSignal(taskId, "requirements", "passed", "OK")
				);

				const resultPromise = signalService.waitSignal({
					taskId,
					signalType: "requirements",
					timeoutMs: 1000,
					pollIntervalMs: 100,
				});

				await vi.runAllTimersAsync();
				const result = await resultPromise;

				expect(result.success).toBe(true);
				expect(mockMetadataRepository.incrementStep).toHaveBeenCalledWith(
					taskId
				);
				expect(mockMetadataRepository.decrementStep).not.toHaveBeenCalled();
			}
		);

		it.concurrent(
			"should decrement step once when single signal is failed",
			async () => {
				const mockRepository = createMockSignalRepository();
				const mockMetadataRepository = createMockMetadataRepository();
				const signalService = new SignalService(
					mockRepository,
					mockMetadataRepository
				);

				const taskId = "task-123";
				vi.mocked(mockRepository.get).mockReturnValue(
					createStoredSignal(taskId, "requirements", "failed", "Error")
				);

				const resultPromise = signalService.waitSignal({
					taskId,
					signalType: "requirements",
					timeoutMs: 1000,
					pollIntervalMs: 100,
				});

				await vi.runAllTimersAsync();
				const result = await resultPromise;

				expect(result.success).toBe(true);
				expect(mockMetadataRepository.decrementStep).toHaveBeenCalledWith(
					taskId
				);
				expect(mockMetadataRepository.incrementStep).not.toHaveBeenCalled();
			}
		);

		it.concurrent(
			"should increment step once when ALL parallel signals are passed",
			async () => {
				const mockRepository = createMockSignalRepository();
				const mockMetadataRepository = createMockMetadataRepository();
				const signalService = new SignalService(
					mockRepository,
					mockMetadataRepository
				);

				const taskId = "task-parallel-passed";
				vi.mocked(mockRepository.get).mockImplementation(
					(tid: string, type: ReportType) => {
						if (tid === taskId) {
							if (type === "performance") {
								return createStoredSignal(tid, type, "passed", "Perf OK");
							}
							if (type === "security") {
								return createStoredSignal(tid, type, "passed", "Sec OK");
							}
						}
						return undefined;
					}
				);

				const resultPromise = signalService.waitSignal({
					taskId,
					signalType: ["performance", "security"],
					timeoutMs: 1000,
					pollIntervalMs: 100,
				});

				await vi.runAllTimersAsync();
				const result = await resultPromise;

				expect(result.success).toBe(true);
				expect(result.content).toHaveLength(2);
				// Critical: should only increment ONCE for parallel steps
				expect(mockMetadataRepository.incrementStep).toHaveBeenCalledWith(
					taskId
				);
				expect(mockMetadataRepository.decrementStep).not.toHaveBeenCalled();
			}
		);

		it.concurrent(
			"should decrement step once when ANY parallel signal is failed",
			async () => {
				const mockRepository = createMockSignalRepository();
				const mockMetadataRepository = createMockMetadataRepository();
				const signalService = new SignalService(
					mockRepository,
					mockMetadataRepository
				);

				const taskId = "task-parallel-mixed";
				vi.mocked(mockRepository.get).mockImplementation(
					(tid: string, type: ReportType) => {
						if (tid === taskId) {
							if (type === "performance") {
								return createStoredSignal(tid, type, "passed", "Perf OK");
							}
							if (type === "security") {
								return createStoredSignal(tid, type, "failed", "Sec FAIL");
							}
						}
						return undefined;
					}
				);

				const resultPromise = signalService.waitSignal({
					taskId,
					signalType: ["performance", "security"],
					timeoutMs: 1000,
					pollIntervalMs: 100,
				});

				await vi.runAllTimersAsync();
				const result = await resultPromise;

				expect(result.success).toBe(true);
				expect(result.content).toHaveLength(2);
				// Critical: should decrement ONCE when any signal fails
				expect(mockMetadataRepository.decrementStep).toHaveBeenCalledWith(
					taskId
				);
				expect(mockMetadataRepository.incrementStep).not.toHaveBeenCalled();
			}
		);

		it.concurrent(
			"should decrement step once when ALL parallel signals are failed",
			async () => {
				const mockRepository = createMockSignalRepository();
				const mockMetadataRepository = createMockMetadataRepository();
				const signalService = new SignalService(
					mockRepository,
					mockMetadataRepository
				);

				const taskId = "task-parallel-all-failed";
				vi.mocked(mockRepository.get).mockImplementation(
					(tid: string, type: ReportType) => {
						if (tid === taskId) {
							if (type === "performance") {
								return createStoredSignal(tid, type, "failed", "Perf FAIL");
							}
							if (type === "security") {
								return createStoredSignal(tid, type, "failed", "Sec FAIL");
							}
						}
						return undefined;
					}
				);

				const resultPromise = signalService.waitSignal({
					taskId,
					signalType: ["performance", "security"],
					timeoutMs: 1000,
					pollIntervalMs: 100,
				});

				await vi.runAllTimersAsync();
				const result = await resultPromise;

				expect(result.success).toBe(true);
				// Critical: should decrement ONCE even if multiple signals failed
				expect(mockMetadataRepository.incrementStep).not.toHaveBeenCalled();
			}
		);

		it.concurrent("should not update metadata on timeout", async () => {
			const mockRepository = createMockSignalRepository();
			const mockMetadataRepository = createMockMetadataRepository();
			const signalService = new SignalService(
				mockRepository,
				mockMetadataRepository
			);

			const taskId = "task-timeout";
			vi.mocked(mockRepository.get).mockReturnValue(undefined);

			const resultPromise = signalService.waitSignal({
				taskId,
				signalType: "requirements",
				timeoutMs: 500,
				pollIntervalMs: 100,
			});

			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result.success).toBe(false);
			expect(result.error).toContain("Timeout");
			expect(mockMetadataRepository.incrementStep).not.toHaveBeenCalled();
			expect(mockMetadataRepository.decrementStep).not.toHaveBeenCalled();
		});
	});

	describe("Signal Content Ordering", () => {
		it.concurrent(
			"should return signals in request order, not discovery order",
			async () => {
				const mockRepository = createMockSignalRepository();
				const mockMetadataRepository = createMockMetadataRepository();
				const signalService = new SignalService(
					mockRepository,
					mockMetadataRepository
				);

				const taskId = "task-order";
				let callCount = 0;

				// Simulate security being found before performance
				vi.mocked(mockRepository.get).mockImplementation(
					(tid: string, type: ReportType) => {
						if (tid !== taskId) return undefined;

						if (type === "performance") {
							// Performance found on 2nd poll
							if (callCount >= 1) {
								return createStoredSignal(tid, type, "passed", "Perf OK");
							}
							return undefined;
						}
						if (type === "security") {
							// Security found immediately
							return createStoredSignal(tid, type, "passed", "Sec OK");
						}
						return undefined;
					}
				);

				const resultPromise = signalService.waitSignal({
					taskId,
					signalType: ["performance", "security"],
					timeoutMs: 5000,
					pollIntervalMs: 100,
				});

				// First poll - only security found
				await vi.advanceTimersByTimeAsync(100);
				callCount = 1;
				// Second poll - both found
				await vi.advanceTimersByTimeAsync(100);

				const result = await resultPromise;

				expect(result.success).toBe(true);
				expect(result.content).toHaveLength(2);
				// Order should match request order: [performance, security]
				expect(result.content![0].summary).toBe("Perf OK");
				expect(result.content![1].summary).toBe("Sec OK");
			}
		);
	});

	describe("Input Validation", () => {
		it.concurrent("should return error for empty taskId", async () => {
			const mockRepository = createMockSignalRepository();
			const mockMetadataRepository = createMockMetadataRepository();
			const signalService = new SignalService(
				mockRepository,
				mockMetadataRepository
			);

			const result = await signalService.waitSignal({
				taskId: "",
				signalType: ReportType.REQUIREMENTS,
				timeoutMs: 1000,
				pollIntervalMs: 100,
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain("taskId");
		});

		it.concurrent("should return error for invalid signalType", async () => {
			const mockRepository = createMockSignalRepository();
			const mockMetadataRepository = createMockMetadataRepository();
			const signalService = new SignalService(
				mockRepository,
				mockMetadataRepository
			);

			const result = await signalService.waitSignal({
				taskId: "task-123",
				signalType: "invalid-type" as ReportType,
				timeoutMs: 1000,
				pollIntervalMs: 100,
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain("signalType");
		});

		it.concurrent("should accept array of signal types", async () => {
			const mockRepository = createMockSignalRepository();
			const mockMetadataRepository = createMockMetadataRepository();
			const signalService = new SignalService(
				mockRepository,
				mockMetadataRepository
			);

			vi.mocked(mockRepository.get).mockImplementation(
				(tid: string, type: ReportType) => {
					return createStoredSignal(tid, type, "passed", "OK");
				}
			);

			const resultPromise = signalService.waitSignal({
				taskId: "task-123",
				signalType: ["performance", "security"],
				timeoutMs: 1000,
				pollIntervalMs: 100,
			});

			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result.success).toBe(true);
			expect(result.content).toHaveLength(2);
		});
	});

	describe("Deduplication", () => {
		it.concurrent(
			"should deduplicate signal types while preserving order",
			async () => {
				const mockRepository = createMockSignalRepository();
				const mockMetadataRepository = createMockMetadataRepository();
				const signalService = new SignalService(
					mockRepository,
					mockMetadataRepository
				);

				vi.mocked(mockRepository.get).mockImplementation(
					(tid: string, type: ReportType) => {
						return createStoredSignal(tid, type, "passed", `${type} OK`);
					}
				);

				const resultPromise = signalService.waitSignal({
					taskId: "task-123",
					signalType: ["performance", "security", "performance"],
					timeoutMs: 1000,
					pollIntervalMs: 100,
				});

				await vi.runAllTimersAsync();
				const result = await resultPromise;

				expect(result.success).toBe(true);
				// Should deduplicate to 2 signals
				expect(result.content).toHaveLength(2);
				expect(result.content![0].summary).toBe("performance OK");
				expect(result.content![1].summary).toBe("security OK");
			}
		);
	});
});
