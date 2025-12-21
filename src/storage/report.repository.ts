import type { ReportType } from "../types/report.type";
import type { IReportRepository } from "../types/report-repository.interface";
import type { IStoredReport } from "../types/stored-report.interface";
import { reportStorage } from "./report.storage";

/**
 * Repository for managing workflow reports.
 * Wraps the underlying storage implementation and handles timestamp generation.
 */
class ReportRepositoryImpl implements IReportRepository {
	/**
	 * Save a report to storage with auto-generated timestamp.
	 * @param taskId - The task identifier
	 * @param reportType - The type of report (workflow stage)
	 * @param content - The report content
	 */
	save(taskId: string, reportType: ReportType, content: string): void {
		const storedReport: IStoredReport = {
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
	get(taskId: string, reportType: ReportType): IStoredReport | undefined {
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

export const reportRepository: IReportRepository = new ReportRepositoryImpl();
