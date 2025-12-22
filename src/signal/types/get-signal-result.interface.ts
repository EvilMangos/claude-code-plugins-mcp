import type { SignalContent } from "../schemas/signal-content.schema";

/**
 * Result type for the getSignal function.
 */
export interface IGetSignalResult {
	success: boolean;
	content?: SignalContent | null;
	error?: string;
}
