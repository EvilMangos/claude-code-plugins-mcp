import { inject, injectable } from "inversify";
import { TOKENS } from "../container";
import type { ReportType } from "../types/report.type";
import type { IReportRepository } from "../types/report-repository.interface";
import type { IReportStorage } from "../types/report-storage.interface";
import type { IStoredReport } from "../types/stored-report.interface";

/**
 * Repository for managing workflow reports.
 * Wraps the underlying report-repository implementation and handles timestamp generation.
 */
@injectable()
export class ReportRepositoryImpl implements IReportRepository {
	constructor(
		@inject(TOKENS.ReportStorage) private readonly storage: IReportStorage
	) {}

	/**
	 * Save a report to report-repository with auto-generated timestamp.
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
		this.storage.save(storedReport);
	}

	/**
	 * Get a report from report-repository.
	 * @param taskId - The task identifier
	 * @param reportType - The type of report (workflow stage)
	 * @returns The stored report if found, undefined otherwise
	 */
	get(taskId: string, reportType: ReportType): IStoredReport | undefined {
		return this.storage.get(taskId, reportType);
	}

	/**
	 * Clear all reports from report-repository.
	 * Useful for test isolation.
	 */
	clear(): void {
		this.storage.clear();
	}
}
