import { z } from "zod";
import { REPORT_TYPES } from "../../types/report.type";
import { taskIdSchema } from "../../schemas/shared.schema";
import { signalContentSchema } from "./signal-content.schema";

/**
 * Zod schema for save-signal input validation.
 */
export const saveSignalSchema = z.object({
	taskId: taskIdSchema,
	signalType: z
		.enum(REPORT_TYPES, {
			message: "signalType must be a valid workflow step",
		})
		.describe("Workflow step this signal belongs to"),
	content: signalContentSchema.describe(
		"Signal content with status and summary"
	),
});

/**
 * Type derived from the save-signal Zod schema.
 */
export type SaveSignalInput = z.infer<typeof saveSignalSchema>;
