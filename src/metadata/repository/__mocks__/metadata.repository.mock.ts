import { vi } from "vitest";
import type { IMetadataRepository } from "../../types/metadata.repository.interface";

/**
 * Creates a fresh mock instance of IMetadataRepository.
 * Use this factory function to get a clean mock for each test suite.
 */
export function createMockMetadataRepository(): IMetadataRepository {
	return {
		create: vi.fn(),
		get: vi.fn(),
		incrementStep: vi.fn(),
		decrementStep: vi.fn(),
		clear: vi.fn(),
	};
}
