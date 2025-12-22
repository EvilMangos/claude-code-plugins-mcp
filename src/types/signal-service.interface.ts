import type { ISaveSignalResult } from "./save-signal-result.interface";
import type { SaveSignalInput } from "../tools/schemas/save-signal.schema";

/**
 * Interface for signal service operations.
 */
export interface ISignalService {
	/**
	 * Save a workflow signal to storage.
	 * @param input - The signal input containing taskId, signalType, and content
	 * @returns A result object with success status and optional error message
	 */
	saveSignal(input: SaveSignalInput): Promise<ISaveSignalResult>;
}
