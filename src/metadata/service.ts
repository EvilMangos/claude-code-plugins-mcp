import { inject, injectable } from "inversify";

import { TOKENS } from "../container";
import { formatStorageError } from "../utils/format-storage.error";
import { formatZodError } from "../utils/format-zod.error";
import {
	type CreateMetadataInput,
	createMetadataSchema,
} from "./schemas/create-metadata.schema";
import {
	type GetNextStepInput,
	getNextStepSchema,
} from "./schemas/get-next-step.schema";
import type { ICreateMetadataResult } from "./types/create-metadata-result.interface";
import type { IGetNextStepResult } from "./types/get-next-step-result.interface";
import type { IMetadataRepository } from "./types/metadata-repository.interface";
import type { IMetadataService } from "./types/metadata-service.interface";

/**
 * Service for managing task metadata.
 * Provides methods to create and retrieve task lifecycle information.
 */
@injectable()
export class MetadataServiceImpl implements IMetadataService {
	constructor(
		@inject(TOKENS.MetadataRepository)
		private readonly repository: IMetadataRepository
	) {}

	/**
	 * Create metadata for a new task.
	 */
	async createMetadata(
		input: CreateMetadataInput
	): Promise<ICreateMetadataResult> {
		const parseResult = createMetadataSchema.safeParse(input);

		if (!parseResult.success) {
			return {
				success: false,
				error: formatZodError(parseResult.error),
			};
		}

		const validatedInput = parseResult.data;

		try {
			this.repository.create(
				validatedInput.taskId,
				validatedInput.executionSteps
			);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: formatStorageError(error),
			};
		}
	}

	/**
	 * Get the next step for a task.
	 */
	async getNextStep(input: GetNextStepInput): Promise<IGetNextStepResult> {
		const parseResult = getNextStepSchema.safeParse(input);

		if (!parseResult.success) {
			return {
				success: false,
				error: formatZodError(parseResult.error),
			};
		}

		const validatedInput = parseResult.data;

		try {
			const metadata = this.repository.get(validatedInput.taskId);

			if (!metadata) {
				return {
					success: false,
					error: `Metadata not found for taskId: ${validatedInput.taskId}`,
				};
			}

			const { currentStepIndex, executionSteps, completedAt } = metadata;
			const isComplete = !!completedAt;

			return {
				success: true,
				taskId: validatedInput.taskId,
				stepNumber: currentStepIndex + 1,
				totalSteps: executionSteps.length,
				step: isComplete ? undefined : executionSteps[currentStepIndex],
				complete: isComplete,
			};
		} catch (error) {
			return {
				success: false,
				error: formatStorageError(error),
			};
		}
	}
}
