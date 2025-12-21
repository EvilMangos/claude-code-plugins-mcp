import { z } from "zod";
import { FILE_TYPES } from "../../storage/types";

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
	reportType: z
		.string({ message: "reportType is required" })
		.min(1, "reportType is required")
		.refine((val) => val.trim().length > 0, {
			message: "reportType cannot be whitespace only",
		}),
	content: z.string({ message: "content is required" }),
	fileType: z.enum(FILE_TYPES, {
		message: "fileType must be one of: full, signal, logs",
	}),
});

/**
 * Type derived from the save-report Zod schema.
 */
export type SaveReportInput = z.infer<typeof saveReportSchema>;

/**
 * Result type for the saveReport function.
 */
export interface SaveReportResult {
	success: boolean;
	error?: string;
}
