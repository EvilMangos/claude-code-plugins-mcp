import { ExecutionStep } from "../../types/execution-step.type";

/**
 * Result of getting the next step.
 */
export interface IGetNextStepResult {
	success: boolean;
	taskId?: string;
	stepNumber?: number;
	totalSteps?: number;
	step?: ExecutionStep;
	complete?: boolean;
	error?: string;
}
