import { injectable } from "inversify";
import type { ReportType } from "../types/report.type";
import type { IReportStorage } from "../types/report-storage.interface";
import type { IStoredReport } from "../types/stored-report.interface";

/**
 * In-memory report-repository for workflow reports.
 * Uses a Map with composite key: {taskId}:{reportType}
 */
@injectable()
export class ReportStorageImpl implements IReportStorage {
	private storage: Map<string, IStoredReport> = new Map();

	/**
	 * Generate composite key from report fields.
	 */
	generateKey(taskId: string, reportType: ReportType): string {
		return `${taskId}:${reportType}`;
	}

	/**
	 * Save a report to report-repository.
	 */
	save(report: IStoredReport): void {
		const key = this.generateKey(report.taskId, report.reportType);
		this.storage.set(key, report);
	}

	/**
	 * Get a report from report-repository.
	 */
	get(taskId: string, reportType: ReportType): IStoredReport | undefined {
		const key = this.generateKey(taskId, reportType);
		return this.storage.get(key);
	}

	/**
	 * Clear all reports from report-repository.
	 */
	clear(): void {
		this.storage.clear();
	}
}
