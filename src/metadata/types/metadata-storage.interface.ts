import type { IStoredMetadata } from "./stored-metadata.interface.js";

/**
 * Storage layer interface for metadata.
 */
export interface IMetadataStorage {
	save(metadata: IStoredMetadata): void;
	get(taskId: string): IStoredMetadata | undefined;
	exists(taskId: string): boolean;
	clear(): void;
}
