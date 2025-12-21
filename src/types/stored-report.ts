import type { ReportType } from "./report-types";

/**
 * Stored report structure.
 */
export interface StoredReport {
	taskId: string;
	reportType: ReportType;
	content: string;
	savedAt: string;
}
