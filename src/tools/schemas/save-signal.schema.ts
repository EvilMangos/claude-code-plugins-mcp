import { z } from "zod";
import { REPORT_TYPES } from "../../types/report.type";
import { SIGNAL_STATUSES } from "../../types/signal.type";
import { taskIdSchema } from "./shared.schema";

/**
 * Zod schema for signal content.
 */
export const signalContentSchema = z.object({
	status: z.enum(SIGNAL_STATUSES, {
		message: "status must be 'passed' or 'failed'",
	}),
	summary: z.string({ message: "summary is required" }),
});

/**
 * Zod schema for save-signal input validation.
 */
export const saveSignalSchema = z.object({
	taskId: taskIdSchema,
	signalType: z.enum(REPORT_TYPES, {
		message: "signalType must be a valid workflow stage",
	}),
	content: signalContentSchema,
});

/**
 * Type derived from the save-signal Zod schema.
 */
export type SaveSignalInput = z.infer<typeof saveSignalSchema>;

/**
 * Type derived from the signal content Zod schema.
 */
export type SignalContent = z.infer<typeof signalContentSchema>;
