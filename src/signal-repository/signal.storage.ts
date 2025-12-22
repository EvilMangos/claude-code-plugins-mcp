import { injectable } from "inversify";
import type { ReportType } from "../types/report.type";
import type { ISignalStorage } from "../types/signal-storage.interface";
import type { IStoredSignal } from "../types/stored-signal.interface";

/**
 * In-memory storage for workflow signals.
 * Uses a Map with composite key: {taskId}:{signalType}
 */
@injectable()
export class SignalStorageImpl implements ISignalStorage {
	private storage: Map<string, IStoredSignal> = new Map();

	/**
	 * Generate composite key from signal fields.
	 */
	generateKey(taskId: string, signalType: ReportType): string {
		return `${taskId}:${signalType}`;
	}

	/**
	 * Save a signal to storage.
	 */
	save(signal: IStoredSignal): void {
		const key = this.generateKey(signal.taskId, signal.signalType);
		this.storage.set(key, signal);
	}

	/**
	 * Get a signal from storage.
	 */
	get(taskId: string, signalType: ReportType): IStoredSignal | undefined {
		const key = this.generateKey(taskId, signalType);
		return this.storage.get(key);
	}

	/**
	 * Clear all signals from storage.
	 */
	clear(): void {
		this.storage.clear();
	}
}
