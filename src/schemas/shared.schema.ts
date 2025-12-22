import { z } from "zod";

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
