import { FileType } from "./types";

export type { FileType };

export interface StoredReport {
	taskId: string;
	reportType: string;
	fileType: FileType;
	content: string;
	savedAt: string;
}

/**
 * In-memory storage for workflow reports.
 * Uses a Map with composite key: {taskId}:{reportType}:{fileType}
 */
class ReportStorage {
	private storage: Map<string, StoredReport> = new Map();

	/**
	 * Generate composite key from report fields.
	 */
	generateKey(taskId: string, reportType: string, fileType: string): string {
		return `${taskId}:${reportType}:${fileType}`;
	}

	/**
	 * Save a report to storage.
	 */
	save(report: StoredReport): void {
		const key = this.generateKey(
			report.taskId,
			report.reportType,
			report.fileType
		);
		this.storage.set(key, report);
	}

	/**
	 * Get a report from storage.
	 */
	get(
		taskId: string,
		reportType: string,
		fileType: string
	): StoredReport | undefined {
		const key = this.generateKey(taskId, reportType, fileType);
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
