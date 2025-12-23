import { ExecutionStep } from "../../types/execution-step.type";

/**
 * Stored metadata structure for task lifecycle tracking.
 */
export interface StoredMetadata {
	taskId: string;
	startedAt: string;
	completedAt?: string;
	savedAt: string;
	executionSteps: ExecutionStep[];
	currentStepIndex: number;
}
