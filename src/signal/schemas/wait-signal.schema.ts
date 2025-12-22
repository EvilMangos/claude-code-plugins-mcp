import { z } from "zod";
import { REPORT_TYPES } from "../../types/report.type";
import { taskIdSchema } from "../../schemas/shared.schema";
import {
	DEFAULT_POLL_INTERVAL_MS,
	DEFAULT_TIMEOUT_MS,
} from "../constants/wait-signal.constants";

/**
 * Zod schema for wait-signal input validation.
 */
export const waitSignalSchema = z.object({
	taskId: taskIdSchema,
	signalType: z.enum(REPORT_TYPES, {
		message: "signalType must be a valid workflow stage",
	}),
	timeoutMs: z
		.number()
		.int()
		.positive()
		.max(600000)
		.optional()
		.default(DEFAULT_TIMEOUT_MS),
	pollIntervalMs: z
		.number()
		.int()
		.positive()
		.min(100)
		.max(60000)
		.optional()
		.default(DEFAULT_POLL_INTERVAL_MS),
});

/**
 * Type derived from the wait-signal Zod schema.
 */
export type WaitSignalInput = z.infer<typeof waitSignalSchema>;
