import { z } from "zod";

import { taskIdSchema } from "../../schemas/shared.schema.js";

/**
 * Schema for save-metadata input validation.
 */
export const saveMetadataSchema = z.object({
	taskId: taskIdSchema,
	completed: z.boolean().optional().default(false),
});

export type SaveMetadataInput = z.infer<typeof saveMetadataSchema>;
