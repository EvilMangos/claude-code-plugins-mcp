import { z } from "zod";
import { REPORT_TYPES } from "../types/report.type";

/**
 * Reusable taskId field schema with validation.
 * Rejects empty strings and whitespace-only values.
 */
export const taskIdSchema = z
	.string({ message: "taskId is required" })
	.min(1, "taskId is required")
	.refine((val) => val.trim().length > 0, {
		message: "taskId cannot be whitespace only",
	})
	.describe("Unique identifier for the workflow task");

const singleStepSchema = z.enum(REPORT_TYPES);
const parallelGroupSchema = z.array(z.enum(REPORT_TYPES)).min(2);
export const executionStepSchema = z.union([
	singleStepSchema,
	parallelGroupSchema,
]);
