import type { IStoredMetadata } from "./stored-metadata.interface.js";

/**
 * Repository layer interface for metadata.
 */
export interface IMetadataRepository {
	save(taskId: string, completed?: boolean): void;
	get(taskId: string): IStoredMetadata | undefined;
	exists(taskId: string): boolean;
	clear(): void;
}
