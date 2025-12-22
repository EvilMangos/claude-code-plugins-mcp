import type { ReportType } from "./report.type";
import type { SignalContent } from "../tools/schemas/save-signal.schema";
import type { IStoredSignal } from "./stored-signal.interface";

/**
 * Interface for signal repository operations.
 */
export interface ISignalRepository {
	/**
	 * Save a signal to storage with auto-generated timestamp.
	 * @param taskId - The task identifier
	 * @param signalType - The type of signal (workflow stage)
	 * @param content - The signal content with status and summary
	 */
	save(taskId: string, signalType: ReportType, content: SignalContent): void;

	/**
	 * Get a signal from storage.
	 * @param taskId - The task identifier
	 * @param signalType - The type of signal (workflow stage)
	 * @returns The stored signal if found, undefined otherwise
	 */
	get(taskId: string, signalType: ReportType): IStoredSignal | undefined;

	/**
	 * Clear all signals from storage.
	 */
	clear(): void;
}
