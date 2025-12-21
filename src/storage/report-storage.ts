import type { ReportType } from "../types/report-types";
import type { StoredReport } from "../types/stored-report";

export type { StoredReport };

/**
 * In-memory storage for workflow reports.
 * Uses a Map with composite key: {taskId}:{reportType}
 */
class ReportStorage {
	private storage: Map<string, StoredReport> = new Map();

	/**
	 * Generate composite key from report fields.
	 */
	generateKey(taskId: string, reportType: ReportType): string {
		return `${taskId}:${reportType}`;
	}

	/**
	 * Save a report to storage.
	 */
	save(report: StoredReport): void {
		const key = this.generateKey(report.taskId, report.reportType);
		this.storage.set(key, report);
	}

	/**
	 * Get a report from storage.
	 */
	get(taskId: string, reportType: ReportType): StoredReport | undefined {
		const key = this.generateKey(taskId, reportType);
		return this.storage.get(key);
	}

	/**
	 * Clear all reports from storage.
	 */
	clear(): void {
		this.storage.clear();
	}
}

export const reportStorage = new ReportStorage();
