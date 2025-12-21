import { z } from "zod";
import { REPORT_TYPES } from "../../types/report-types";

/**
 * Zod schema for save-report input validation.
 * Uses .trim() to reject whitespace-only strings.
 */
export const saveReportSchema = z.object({
	taskId: z
		.string({ message: "taskId is required" })
		.min(1, "taskId is required")
		.refine((val) => val.trim().length > 0, {
			message: "taskId cannot be whitespace only",
		}),
	reportType: z.enum(REPORT_TYPES, {
		message: "reportType must be a valid workflow stage",
	}),
	content: z.string({ message: "content is required" }),
});

/**
 * Type derived from the save-report Zod schema.
 */
export type SaveReportInput = z.infer<typeof saveReportSchema>;
