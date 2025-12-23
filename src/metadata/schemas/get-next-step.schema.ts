import { z } from "zod";

import { taskIdSchema } from "../../schemas/shared.schema";

/**
 * Schema for get-next-step input validation.
 */
export const getNextStepSchema = z.object({
	taskId: taskIdSchema.describe("Unique identifier for the workflow task"),
});

export type GetNextStepInput = z.infer<typeof getNextStepSchema>;
