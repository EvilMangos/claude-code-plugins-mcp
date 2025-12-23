import type { IStoredMetadata } from "./stored-metadata.interface";
import { ExecutionStep } from "../../types/execution-step.type";

/**
 * Repository layer interface for metadata.
 */
export interface IMetadataRepository {
	create(taskId: string, executionSteps: ExecutionStep[]): void;
	get(taskId: string): IStoredMetadata | undefined;
	incrementStep(taskId: string): void;
	decrementStep(taskId: string): void;
	clear(): void;
}
