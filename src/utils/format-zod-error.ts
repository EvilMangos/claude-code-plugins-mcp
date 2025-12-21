import { z } from "zod";

/**
 * Format a Zod error into a user-friendly error message.
 * Returns the first error with field path prefixed for clarity.
 *
 * @param error - The Zod error to format
 * @returns A formatted error message string
 */
export function formatZodError(error: z.ZodError): string {
	const firstIssue = error.issues[0];
	const fieldPath = firstIssue.path.join(".");
	return fieldPath ? `${fieldPath}: ${firstIssue.message}` : firstIssue.message;
}
