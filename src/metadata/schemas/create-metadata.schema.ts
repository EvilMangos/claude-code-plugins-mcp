import { z } from "zod";

import { executionStepSchema, taskIdSchema } from "../../schemas/shared.schema";

/**
 * Schema for create-metadata input validation.
 */
export const createMetadataSchema = z.object({
	taskId: taskIdSchema.describe("Unique identifier for the workflow task"),
	executionSteps: z
		.array(executionStepSchema)
		.min(1)
		.describe(
			"Ordered list of workflow steps to execute. Use arrays for parallel steps: ['plan', ['performance', 'security'], 'refactoring']"
		),
});

export type CreateMetadataInput = z.infer<typeof createMetadataSchema>;
