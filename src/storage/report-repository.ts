import type { ReportType } from "../types/report-types";
import type { StoredReport } from "../types/stored-report";
import { reportStorage } from "./report-storage";

/**
 * Repository for managing workflow reports.
 * Wraps the underlying storage implementation and handles timestamp generation.
 */
class ReportRepository {
	/**
	 * Save a report to storage with auto-generated timestamp.
	 * @param taskId - The task identifier
	 * @param reportType - The type of report (workflow stage)
	 * @param content - The report content
	 */
	save(taskId: string, reportType: ReportType, content: string): void {
		const storedReport: StoredReport = {
			taskId,
			reportType,
			content,
			savedAt: new Date().toISOString(),
		};
		reportStorage.save(storedReport);
	}

	/**
	 * Get a report from storage.
	 * @param taskId - The task identifier
	 * @param reportType - The type of report (workflow stage)
	 * @returns The stored report if found, undefined otherwise
	 */
	get(taskId: string, reportType: ReportType): StoredReport | undefined {
		return reportStorage.get(taskId, reportType);
	}

	/**
	 * Clear all reports from storage.
	 * Useful for test isolation.
	 */
	clear(): void {
		reportStorage.clear();
	}
}

export const reportRepository = new ReportRepository();
