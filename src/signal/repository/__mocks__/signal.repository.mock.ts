import { vi } from "vitest";
import type { ISignalRepository } from "../../types/signal.repository.interface";

/**
 * Creates a fresh mock instance of ISignalRepository.
 * Use this factory function to get a clean mock for each test suite.
 */
export function createMockSignalRepository(): ISignalRepository {
	return {
		save: vi.fn(),
		get: vi.fn(),
		clear: vi.fn(),
	};
}
