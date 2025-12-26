import { z } from "zod";
import { executionStepSchema, taskIdSchema } from "../../schemas/shared.schema";

/**
 * Zod schema for wait-signal input validation.
 * Timeout and polling interval are configured server-side via environment variables.
 */
export const waitSignalSchema = z.object({
	taskId: taskIdSchema,
	signalType: executionStepSchema.describe(
		"Workflow step or steps to wait for"
	),
});

/**
 * Type derived from the wait-signal Zod schema.
 */
export type WaitSignalInput = z.infer<typeof waitSignalSchema>;
