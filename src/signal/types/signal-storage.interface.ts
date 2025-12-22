import type { ReportType } from "../../types/report.type";
import type { IStoredSignal } from "./stored-signal.interface";

/**
 * Interface for signal storage operations.
 */
export interface ISignalStorage {
	/**
	 * Generate composite key from signal fields.
	 * @param taskId - The task identifier
	 * @param signalType - The type of signal
	 * @returns The composite key
	 */
	generateKey(taskId: string, signalType: ReportType): string;

	/**
	 * Save a signal to storage.
	 * @param signal - The signal to save
	 */
	save(signal: IStoredSignal): void;

	/**
	 * Get a signal from storage.
	 * @param taskId - The task identifier
	 * @param signalType - The type of signal
	 * @returns The stored signal if found, undefined otherwise
	 */
	get(taskId: string, signalType: ReportType): IStoredSignal | undefined;

	/**
	 * Clear all signals from storage.
	 */
	clear(): void;
}
