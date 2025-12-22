import { inject, injectable } from "inversify";

import { TOKENS } from "../container";
import { formatStorageError } from "../utils/format-storage.error.js";
import { formatZodError } from "../utils/format-zod.error.js";
import {
	type GetMetadataInput,
	getMetadataSchema,
} from "./schemas/get-metadata.schema.js";
import {
	type SaveMetadataInput,
	saveMetadataSchema,
} from "./schemas/save-metadata.schema.js";
import type { IGetMetadataResult } from "./types/get-metadata-result.interface.js";
import type { IMetadataRepository } from "./types/metadata-repository.interface.js";
import type { IMetadataService } from "./types/metadata-service.interface.js";
import type { ISaveMetadataResult } from "./types/save-metadata-result.interface.js";

/**
 * Service for managing task metadata.
 * Provides methods to save and retrieve task lifecycle information.
 */
@injectable()
export class MetadataServiceImpl implements IMetadataService {
	constructor(
		@inject(TOKENS.MetadataRepository)
		private readonly repository: IMetadataRepository
	) {}

	/**
	 * Save or update metadata for a task.
	 */
	async saveMetadata(input: SaveMetadataInput): Promise<ISaveMetadataResult> {
		const parseResult = saveMetadataSchema.safeParse(input);

		if (!parseResult.success) {
			return {
				success: false,
				error: formatZodError(parseResult.error),
			};
		}

		const validatedInput = parseResult.data;

		try {
			this.repository.save(validatedInput.taskId, validatedInput.completed);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: formatStorageError(error),
			};
		}
	}

	/**
	 * Get metadata for a task.
	 */
	async getMetadata(input: GetMetadataInput): Promise<IGetMetadataResult> {
		const parseResult = getMetadataSchema.safeParse(input);

		if (!parseResult.success) {
			return {
				success: false,
				error: formatZodError(parseResult.error),
			};
		}

		const validatedInput = parseResult.data;

		try {
			const metadata = this.repository.get(validatedInput.taskId);
			return {
				success: true,
				metadata: metadata ?? null,
			};
		} catch (error) {
			return {
				success: false,
				error: formatStorageError(error),
			};
		}
	}

	/**
	 * Check if metadata exists for a taskId.
	 * Used for fail-fast validation in waitSignal.
	 */
	taskExists(taskId: string): boolean {
		return this.repository.exists(taskId);
	}
}
