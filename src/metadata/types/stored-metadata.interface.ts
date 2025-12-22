import type { ReportType } from "../../types/report.type.js";

/**
 * Stored metadata structure for task lifecycle tracking.
 */
export interface IStoredMetadata {
	taskId: string;
	startedAt: string;
	completedAt?: string;
	savedAt: string;
	executionSteps: ReportType[];
	currentStepIndex: number;
}
