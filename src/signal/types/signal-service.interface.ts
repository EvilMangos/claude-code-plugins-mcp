import type { ISaveSignalResult } from "./save-signal-result.interface";
import type { IGetSignalResult } from "./get-signal-result.interface";
import type { SaveSignalInput } from "../schemas/save-signal.schema";
import type { GetSignalInput } from "../schemas/get-signal.schema";

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

	/**
	 * Get a workflow signal from storage.
	 * @param input - The signal input containing taskId and signalType
	 * @returns A result object with success status and optional signal content or error message
	 */
	getSignal(input: GetSignalInput): Promise<IGetSignalResult>;
}
