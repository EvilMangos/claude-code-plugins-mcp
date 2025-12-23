import { vi } from "vitest";
import type { IReportRepository } from "../../types/report.repository.interface";

/**
 * Creates a fresh mock instance of IReportRepository.
 * Use this factory function to get a clean mock for each test suite.
 */
export function createMockReportRepository(): IReportRepository {
	return {
		save: vi.fn(),
		get: vi.fn(),
		clear: vi.fn(),
	};
}
