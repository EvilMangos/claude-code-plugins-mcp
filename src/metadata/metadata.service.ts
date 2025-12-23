import { inject, injectable } from "inversify";

import { TOKENS } from "../container";
import { formatError } from "../utils/format-error";
import { validateInput } from "../utils/validate-input";
import {
	type CreateMetadataInput,
	createMetadataSchema,
} from "./schemas/create-metadata.schema";
import {
	type GetNextStepInput,
	getNextStepSchema,
} from "./schemas/get-next-step.schema";
import type { CreateMetadataResult } from "./types/create-metadata-result.interface";
import type { GetNextStepResult } from "./types/get-next-step-result.interface";
import type { MetadataRepository } from "./types/metadata.repository.interface";
import type { MetadataService as MetadataServiceInterface } from "./types/metadata.service.interface";

/**
 * Service for managing task metadata.
 * Provides methods to create and retrieve task lifecycle information.
 */
@injectable()
export class MetadataService implements MetadataServiceInterface {
	constructor(
		@inject(TOKENS.MetadataRepository)
		private readonly repository: MetadataRepository
	) {}

	/**
	 * Create metadata for a new task.
	 */
	async createMetadata(
		input: CreateMetadataInput
	): Promise<CreateMetadataResult> {
		const validation = validateInput(createMetadataSchema, input);

		if (!validation.success) {
			return validation;
		}

		const validatedInput = validation.data;

		try {
			this.repository.create(
				validatedInput.taskId,
				validatedInput.executionSteps
			);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: formatError(error),
			};
		}
	}

	/**
	 * Get the next step for a task.
	 */
	async getNextStep(input: GetNextStepInput): Promise<GetNextStepResult> {
		const validation = validateInput(getNextStepSchema, input);

		if (!validation.success) {
			return validation;
		}

		const validatedInput = validation.data;

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
				error: formatError(error),
			};
		}
	}
}
