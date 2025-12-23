/**
 * Generic result type for operations that can succeed or fail.
 * Used as a base for module-specific operation results.
 */
export interface OperationResult {
	success: boolean;
	error?: string;
}
