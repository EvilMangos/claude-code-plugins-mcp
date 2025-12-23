import type { SaveSignalResult } from "./save-signal-result.interface";
import type { WaitSignalResult } from "./wait-signal-result.interface";
import type { SaveSignalInput } from "../schemas/save-signal.schema";
import type { WaitSignalInput } from "../schemas/wait-signal.schema";

/**
 * Interface for signal service operations.
 */
export interface SignalService {
	/**
	 * Save a workflow signal to storage.
	 * @param input - The signal input containing taskId, signalType, and content
	 * @returns A result object with success status and optional error message
	 */
	saveSignal(input: SaveSignalInput): Promise<SaveSignalResult>;

	/**
	 * Wait for a workflow signal to appear in storage.
	 * Polls the storage at regular intervals until the signal is found or timeout is reached.
	 * @param input - The signal input containing taskId, signalType, and optional timeout/polling settings
	 * @returns A result object with success status, signal content if found, wait time, or error message
	 */
	waitSignal(input: WaitSignalInput): Promise<WaitSignalResult>;
}
