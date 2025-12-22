import { z } from "zod";
import { SIGNAL_STATUSES } from "../types/signal-status.type";

/**
 * Zod schema for signal content.
 */
export const signalContentSchema = z.object({
	status: z
		.enum(SIGNAL_STATUSES, {
			message: "status must be 'passed' or 'failed'",
		})
		.describe("Signal outcome"),
	summary: z
		.string({ message: "summary is required" })
		.describe("Brief description of the signal result"),
});

/**
 * Type derived from the signal content Zod schema.
 */
export type SignalContent = z.infer<typeof signalContentSchema>;
