import { vi } from "vitest";
import type { SignalRepository } from "../../types/signal.repository.interface";

/**
 * Creates a fresh mock instance of SignalRepository.
 * Use this factory function to get a clean mock for each test suite.
 */
export function createMockSignalRepository(): SignalRepository {
	return {
		save: vi.fn(),
		get: vi.fn(),
		clear: vi.fn(),
	};
}
