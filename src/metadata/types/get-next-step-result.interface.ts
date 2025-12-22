import type { ReportType } from "../../types/report.type.js";

/**
 * Result of getting the next step.
 */
export interface IGetNextStepResult {
	success: boolean;
	taskId?: string;
	stepNumber?: number;
	totalSteps?: number;
	step?: ReportType;
	complete?: boolean;
	error?: string;
}
