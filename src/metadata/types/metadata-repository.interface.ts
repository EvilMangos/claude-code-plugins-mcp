import type { ReportType } from "../../types/report.type.js";
import type { IStoredMetadata } from "./stored-metadata.interface.js";

/**
 * Repository layer interface for metadata.
 */
export interface IMetadataRepository {
	create(taskId: string, executionSteps: ReportType[]): void;
	get(taskId: string): IStoredMetadata | undefined;
	exists(taskId: string): boolean;
	incrementStep(taskId: string): void;
	decrementStep(taskId: string): void;
	clear(): void;
}
