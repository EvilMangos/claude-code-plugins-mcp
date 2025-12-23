import { vi } from "vitest";
import type { MetadataRepository } from "../../types/metadata.repository.interface";

/**
 * Creates a fresh mock instance of MetadataRepository.
 * Use this factory function to get a clean mock for each test suite.
 */
export function createMockMetadataRepository(): MetadataRepository {
	return {
		create: vi.fn(),
		get: vi.fn(),
		incrementStep: vi.fn(),
		decrementStep: vi.fn(),
		clear: vi.fn(),
	};
}
