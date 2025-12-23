import { injectable } from "inversify";

import type { IMetadataStorage } from "../types/metadata-storage.interface";
import type { IStoredMetadata } from "../types/stored-metadata.interface";

/**
 * In-memory storage for task metadata.
 * Uses a Map with key: {taskId}
 */
@injectable()
export class MetadataStorageImpl implements IMetadataStorage {
	private storage: Map<string, IStoredMetadata> = new Map();

	/**
	 * Save metadata to storage.
	 */
	save(metadata: IStoredMetadata): void {
		this.storage.set(metadata.taskId, metadata);
	}

	/**
	 * Get metadata from storage.
	 */
	get(taskId: string): IStoredMetadata | undefined {
		return this.storage.get(taskId);
	}

	/**
	 * Check if metadata exists for a taskId.
	 */
	exists(taskId: string): boolean {
		return this.storage.has(taskId);
	}

	/**
	 * Clear all metadata from storage.
	 */
	clear(): void {
		this.storage.clear();
	}
}
