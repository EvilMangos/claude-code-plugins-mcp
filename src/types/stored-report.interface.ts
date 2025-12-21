import type { ReportType } from "./report.type";

/**
 * Stored report structure.
 */
export interface IStoredReport {
	taskId: string;
	reportType: ReportType;
	content: string;
	savedAt: string;
}
