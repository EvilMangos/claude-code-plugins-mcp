import type { ReportType } from "../../types/report.type";
import type { IStoredReport } from "./stored-report.interface";

/**
 * Interface for report report-repository operations.
 */
export interface IReportStorage {
	/**
	 * Generate composite key from report fields.
	 * @param taskId - The task identifier
	 * @param reportType - The type of report
	 * @returns The composite key
	 */
	generateKey(taskId: string, reportType: ReportType): string;

	/**
	 * Save a report to report-repository.
	 * @param report - The report to save
	 */
	save(report: IStoredReport): void;

	/**
	 * Get a report from report-repository.
	 * @param taskId - The task identifier
	 * @param reportType - The type of report
	 * @returns The stored report if found, undefined otherwise
	 */
	get(taskId: string, reportType: ReportType): IStoredReport | undefined;

	/**
	 * Clear all reports from report-repository.
	 */
	clear(): void;
}
