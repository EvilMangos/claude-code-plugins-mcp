import { z } from "zod";

import { taskIdSchema } from "../../schemas/shared.schema.js";
import { REPORT_TYPES } from "../../types/report.type.js";

/**
 * Schema for create-metadata input validation.
 */
export const createMetadataSchema = z.object({
	taskId: taskIdSchema.describe("Unique identifier for the workflow task"),
	executionSteps: z
		.array(z.enum(REPORT_TYPES))
		.min(1)
		.describe(
			"Ordered list of workflow steps to execute. Should keep correct order of steps without setup step"
		),
});

export type CreateMetadataInput = z.infer<typeof createMetadataSchema>;
