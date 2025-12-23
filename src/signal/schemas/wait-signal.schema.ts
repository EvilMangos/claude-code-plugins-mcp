import { z } from "zod";
import { executionStepSchema, taskIdSchema } from "../../schemas/shared.schema";
import {
	DEFAULT_POLL_INTERVAL_MS,
	DEFAULT_TIMEOUT_MS,
} from "../constants/wait-signal.constants";

/**
 * Zod schema for wait-signal input validation.
 */
export const waitSignalSchema = z.object({
	taskId: taskIdSchema,
	signalType: executionStepSchema.describe(
		"Workflow step or steps to wait for"
	),
	timeoutMs: z
		.number()
		.int()
		.positive()
		.max(600000)
		.optional()
		.default(DEFAULT_TIMEOUT_MS)
		.describe(
			"Maximum wait time in milliseconds (default: 30000, max: 600000)"
		),
	pollIntervalMs: z
		.number()
		.int()
		.positive()
		.min(100)
		.max(60000)
		.optional()
		.default(DEFAULT_POLL_INTERVAL_MS)
		.describe(
			"Polling interval in milliseconds (default: 1000, min: 100, max: 60000)"
		),
});

/**
 * Type derived from the wait-signal Zod schema.
 */
export type WaitSignalInput = z.infer<typeof waitSignalSchema>;
