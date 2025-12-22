import { z } from "zod";
import { REPORT_TYPES } from "../../types/report.type";
import { taskIdSchema } from "../../schemas/shared.schema";

/**
 * Zod schema for get-report input validation.
 */
export const getReportSchema = z.object({
	taskId: taskIdSchema,
	reportType: z
		.enum(REPORT_TYPES, {
			message: "reportType must be a valid workflow step",
		})
		.describe("Workflow step"),
});

/**
 * Type derived from the get-report Zod schema.
 */
export type GetReportInput = z.infer<typeof getReportSchema>;
