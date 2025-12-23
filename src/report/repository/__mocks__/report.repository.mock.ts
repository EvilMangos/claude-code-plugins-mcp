import { vi } from "vitest";
import type { ReportRepository } from "../../types/report.repository.interface";

/**
 * Creates a fresh mock instance of ReportRepository.
 * Use this factory function to get a clean mock for each test suite.
 */
export function createMockReportRepository(): ReportRepository {
	return {
		save: vi.fn(),
		get: vi.fn(),
		clear: vi.fn(),
	};
}
