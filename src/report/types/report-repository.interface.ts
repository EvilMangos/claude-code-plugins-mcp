import type { ReportType } from "../../types/report.type";
import type { IStoredReport } from "./stored-report.interface";

/**
 * Interface for report repository operations.
 */
export interface IReportRepository {
	/**
	 * Save a report to report-repository with auto-generated timestamp.
	 * @param taskId - The task identifier
	 * @param reportType - The type of report (workflow step)
	 * @param content - The report content
	 */
	save(taskId: string, reportType: ReportType, content: string): void;

	/**
	 * Get a report from report-repository.
	 * @param taskId - The task identifier
	 * @param reportType - The type of report (workflow step)
	 * @returns The stored report if found, undefined otherwise
	 */
	get(taskId: string, reportType: ReportType): IStoredReport | undefined;

	/**
	 * Clear all reports from report-repository.
	 */
	clear(): void;
}
