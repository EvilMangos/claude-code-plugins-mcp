/**
 * Format a report-repository error into a user-friendly error message.
 * Handles both Error instances and unknown thrown values.
 *
 * @param error - The caught error to format
 * @returns A formatted error message string
 */
export function formatStorageError(error: unknown): string {
	return error instanceof Error
		? error.message
		: "Unknown report-repository error";
}
