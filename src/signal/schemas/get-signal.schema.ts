import { z } from "zod";
import { REPORT_TYPES } from "../../types/report.type";
import { taskIdSchema } from "../../schemas/shared.schema";

/**
 * Zod schema for get-signal input validation.
 */
export const getSignalSchema = z.object({
	taskId: taskIdSchema,
	signalType: z.enum(REPORT_TYPES, {
		message: "signalType must be a valid workflow stage",
	}),
});

/**
 * Type derived from the get-signal Zod schema.
 */
export type GetSignalInput = z.infer<typeof getSignalSchema>;
