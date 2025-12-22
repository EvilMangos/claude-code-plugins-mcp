import { z } from "zod";

import { taskIdSchema } from "../../schemas/shared.schema.js";

/**
 * Schema for get-metadata input validation.
 */
export const getMetadataSchema = z.object({
	taskId: taskIdSchema,
});

export type GetMetadataInput = z.infer<typeof getMetadataSchema>;
