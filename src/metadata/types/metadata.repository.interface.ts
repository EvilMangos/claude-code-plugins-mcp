import type { ExecutionStep } from "../../types/execution-step.type";
import type { StoredMetadata } from "./stored-metadata.interface";

/**
 * Repository layer interface for metadata.
 */
export interface MetadataRepository {
	/**
	 * Create metadata for a new task with auto-generated timestamps.
	 * Sets startedAt and savedAt, initializes currentStepIndex to 0.
	 * @param taskId - The task identifier
	 * @param executionSteps - The execution steps for this task
	 */
	create(taskId: string, executionSteps: ExecutionStep[]): void;

	/**
	 * Get metadata for a task.
	 * @param taskId - The task identifier
	 * @returns The stored metadata if found, undefined otherwise
	 */
	get(taskId: string): StoredMetadata | undefined;

	/**
	 * Increment the currentStepIndex for a task.
	 * No-op if metadata doesn't exist.
	 * Sets completedAt when incrementing from the last step.
	 * @param taskId - The task identifier
	 */
	incrementStep(taskId: string): void;

	/**
	 * Decrement the currentStepIndex for a task.
	 * No-op if metadata doesn't exist or already at step 0.
	 * @param taskId - The task identifier
	 */
	decrementStep(taskId: string): void;

	/**
	 * Clear all metadata from repository.
	 */
	clear(): void;
}
