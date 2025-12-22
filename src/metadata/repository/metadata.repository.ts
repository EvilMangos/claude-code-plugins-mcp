import { inject, injectable } from "inversify";

import { TOKENS } from "../../container/index.js";
import type { IMetadataRepository } from "../types/metadata-repository.interface.js";
import type { IMetadataStorage } from "../types/metadata-storage.interface.js";
import type { IStoredMetadata } from "../types/stored-metadata.interface.js";

/**
 * Repository for managing task metadata.
 * Wraps the underlying storage implementation and handles timestamp generation.
 */
@injectable()
export class MetadataRepositoryImpl implements IMetadataRepository {
	constructor(
		@inject(TOKENS.MetadataStorage)
		private readonly storage: IMetadataStorage
	) {}

	/**
	 * Save or update metadata for a task.
	 * On first save: sets startedAt.
	 * On update: updates savedAt.
	 * If completed=true: sets completedAt.
	 */
	save(taskId: string, completed?: boolean): void {
		const existing = this.storage.get(taskId);
		const now = new Date().toISOString();

		const storedMetadata: IStoredMetadata = {
			taskId,
			startedAt: existing?.startedAt ?? now,
			completedAt: completed ? now : existing?.completedAt,
			savedAt: now,
		};

		this.storage.save(storedMetadata);
	}

	/**
	 * Get metadata for a task.
	 */
	get(taskId: string): IStoredMetadata | undefined {
		return this.storage.get(taskId);
	}

	/**
	 * Check if metadata exists for a taskId.
	 */
	exists(taskId: string): boolean {
		return this.storage.exists(taskId);
	}

	/**
	 * Clear all metadata from storage.
	 */
	clear(): void {
		this.storage.clear();
	}
}
