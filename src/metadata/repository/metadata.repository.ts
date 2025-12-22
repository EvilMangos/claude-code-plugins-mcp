import { inject, injectable } from "inversify";

import { TOKENS } from "../../container";
import type { ReportType } from "../../types/report.type.js";
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
	 * Create metadata for a new task.
	 * Sets startedAt, initializes currentStepIndex to 0.
	 */
	create(taskId: string, executionSteps: ReportType[]): void {
		const now = new Date().toISOString();

		const storedMetadata: IStoredMetadata = {
			taskId,
			startedAt: now,
			savedAt: now,
			executionSteps,
			currentStepIndex: 0,
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
	 * Increment the currentStepIndex for a task.
	 * No-op if metadata doesn't exist.
	 * Sets completedAt when incrementing from the last step.
	 */
	incrementStep(taskId: string): void {
		const metadata = this.storage.get(taskId);
		if (!metadata) return;

		const now = new Date().toISOString();
		const maxIndex = metadata.executionSteps.length - 1;

		if (metadata.currentStepIndex >= maxIndex) {
			// At last step - mark as complete
			this.storage.save({
				...metadata,
				completedAt: now,
				savedAt: now,
			});
			return;
		}

		this.storage.save({
			...metadata,
			currentStepIndex: metadata.currentStepIndex + 1,
			savedAt: now,
		});
	}

	/**
	 * Decrement the currentStepIndex for a task.
	 * No-op if metadata doesn't exist or already at step 0.
	 */
	decrementStep(taskId: string): void {
		const metadata = this.storage.get(taskId);
		if (!metadata) return;

		if (metadata.currentStepIndex <= 0) return;

		const now = new Date().toISOString();
		this.storage.save({
			...metadata,
			currentStepIndex: metadata.currentStepIndex - 1,
			savedAt: now,
		});
	}

	/**
	 * Clear all metadata from storage.
	 */
	clear(): void {
		this.storage.clear();
	}
}
