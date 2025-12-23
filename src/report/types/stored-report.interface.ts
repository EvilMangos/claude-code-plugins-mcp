import type { ReportType } from "../../types/report.type";

/**
 * Stored report structure.
 */
export interface StoredReport {
	taskId: string;
	reportType: ReportType;
	content: string;
	savedAt: string;
}
