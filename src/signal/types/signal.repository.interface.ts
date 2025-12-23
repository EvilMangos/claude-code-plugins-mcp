import type { ReportType } from "../../types/report.type";
import type { SignalContent } from "../schemas/signal-content.schema";
import type { StoredSignal } from "./stored-signal.interface";

/**
 * Interface for signal repository operations.
 */
export interface SignalRepository {
	/**
	 * Save a signal with auto-generated timestamp.
	 * @param taskId - The task identifier
	 * @param signalType - The type of signal (workflow step)
	 * @param content - The signal content with status and summary
	 */
	save(taskId: string, signalType: ReportType, content: SignalContent): void;

	/**
	 * Get a signal from storage.
	 * @param taskId - The task identifier
	 * @param signalType - The type of signal (workflow step)
	 * @returns The stored signal if found, undefined otherwise
	 */
	get(taskId: string, signalType: ReportType): StoredSignal | undefined;

	/**
	 * Clear all signals from storage.
	 */
	clear(): void;
}
