import { z } from "zod";
import { REPORT_TYPES } from "../../types/report.type";
import { taskIdSchema } from "../../schemas/shared.schema";

/**
 * Zod schema for save-report input validation.
 */
export const saveReportSchema = z.object({
	taskId: taskIdSchema,
	reportType: z.enum(REPORT_TYPES, {
		message: "reportType must be a valid workflow stage",
	}),
	content: z.string({ message: "content is required" }),
});

/**
 * Type derived from the save-report Zod schema.
 */
export type SaveReportInput = z.infer<typeof saveReportSchema>;
