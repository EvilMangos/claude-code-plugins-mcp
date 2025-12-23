import type { SignalContent } from "../schemas/signal-content.schema";

/**
 * Result of a wait-signal operation.
 */
export interface IWaitSignalResult {
	/**
	 * Indicates whether the operation was successful.
	 */
	success: boolean;

	/**
	 * The signal content if found within the timeout period.
	 * Undefined if the operation failed or timed out.
	 */
	content?: SignalContent[];

	/**
	 * How long the operation waited in milliseconds before the signal was found.
	 * Only present on success.
	 */
	waitedMs?: number;

	/**
	 * Error message if the operation failed or timed out.
	 */
	error?: string;
}
